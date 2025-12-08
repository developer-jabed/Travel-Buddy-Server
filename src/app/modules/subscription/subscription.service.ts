import prisma from "../../../shared/prisma";
import { stripe } from "../../../helpers/stripe";
import { calculateFinalPrice } from "../../../utils/calcPrice";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interfaces/pagination";
import { PaymentStatus, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import config from "../../../config";

export const SubscriptionService = {

  // ---------------------------------------------------
  // CREATE SUBSCRIPTION
  createSubscription: async (
    userId: string,
    plan: SubscriptionPlan,
    amount: number
  ) => {

    if (!plan) throw new Error("Plan is required");

    // 1️⃣ Get Pricing
    const pricing = await prisma.subscriptionPlanPricing.findFirst({
      where: { plan },
    });

    if (!pricing) throw new Error("Invalid subscription plan");

    const durationDays = pricing.durationDays;

    // 2️⃣ Dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);

    // 3️⃣ Final Price
    const finalPrice = calculateFinalPrice(
      pricing.basePrice,
      pricing.discountType ?? undefined,
      pricing.discountValue ?? undefined
    );

    // ⭐ Verify the user (isVerified = true)
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
      },
    });

    // 4️⃣ Create Payment
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: finalPrice,
        status: PaymentStatus.SUCCESS,
      },
    });

    // 5️⃣ Create/Update Subscription
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

    // 6️⃣ Stripe Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: { name: `${plan} Subscription` },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${config.clientURL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientURL}/payment/failed`,

      metadata: {
        userId,
        plan,
        paymentId: payment.id,
      },
    });

    return {
      success: true,
      checkoutUrl: checkoutSession.url!,
      amount: finalPrice,
    };
  },



  // ---------------------------------------------------
  // GET ALL (PAGINATION)
  // ---------------------------------------------------
  getAllSubscriptions: async (options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);

    const [data, total] = await Promise.all([
      prisma.subscription.findMany({
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscription.count(),
    ]);

    return { meta: { page, limit, total }, data };
  },

  // ---------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------
  getSubscriptionById: async (id: string) => {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!subscription) throw new Error("Subscription not found");
    return subscription;
  },

  // ---------------------------------------------------
  // UPDATE
  // ---------------------------------------------------
  updateSubscription: async (id: string, payload: any) => {
    return await prisma.subscription.update({
      where: { id },
      data: payload,
    });
  },

  // ---------------------------------------------------
  // DELETE
  // ---------------------------------------------------
  deleteSubscription: async (id: string) => {
    return await prisma.subscription.delete({
      where: { id },
    });
  },
};
