import Stripe from "stripe";
import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;

            console.log("session:",session);

            const paymentId = session.metadata?.paymentId;
            const plan = session.metadata?.plan;
            const userId = session.metadata?.userId;

            if (!paymentId || !userId || !plan) {
                console.error("❌ Missing metadata in webhook");
                return;
            }

            // 1️⃣ Update payment
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status:
                        session.payment_status === "paid"
                            ? PaymentStatus.SUCCESS
                            : PaymentStatus.FAILED,
                    paymentGatewayData: session,
                },
            });

            // 2️⃣ Mark user verified
            await prisma.user.update({
                where: { id: userId },
                data: { isVerified: true },
            });

            console.log("💰 Payment updated:", paymentId);

            if (session.payment_status !== "paid") return;

            // 3️⃣ Fetch plan pricing
            const pricing = await prisma.subscriptionPlanPricing.findFirst({
                where: { plan },
            });

            if (!pricing) {
                console.error("❌ Pricing not found for plan:", plan);
                return;
            }

            // 4️⃣ Calculate dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + pricing.durationDays);

            // 5️⃣ Create or update subscription
            await prisma.subscription.upsert({
                where: { userId },
                update: {
                    plan,
                    status: SubscriptionStatus.ACTIVE,
                    startDate,
                    endDate,
                },
                create: {
                    userId,
                    plan,
                    status: SubscriptionStatus.ACTIVE,
                    startDate,
                    endDate,
                },
            });

            console.log("📅 Subscription activated for user:", userId);

            break;
        }

        default:
            console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
};

export const PaymentService = {
    handleStripeWebhookEvent,
};
