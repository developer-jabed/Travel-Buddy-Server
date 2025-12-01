import { PaymentStatus, SubscriptionPlan } from "@prisma/client";
import { stripe } from "../../../helpers/stripe";
import prisma from "../../../shared/prisma";
import { calculateFinalPrice } from "../../../utils/calcPrice";

const subscribe = async (
  userId: string,
  plan: SubscriptionPlan,    // <-- ENUM TYPE
  paymentMethodId: string
) => {

  const pricing = await prisma.subscriptionPlanPricing.findUnique({
    where: { plan },
  });

  if (!pricing) throw new Error("Invalid subscription plan");

  const finalPrice = calculateFinalPrice(
    pricing.basePrice,
    pricing.discountType ?? undefined,
    pricing.discountValue ?? undefined
  );

  // Create Stripe payment
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(finalPrice * 100),
    currency: "BDT",
    payment_method: paymentMethodId,
    confirm: true,
  });

  // Decide PaymentStatus
  const paymentStatus =
    paymentIntent.status === "succeeded"
      ? PaymentStatus.SUCCESS
      : PaymentStatus.FAILED;

  // Store Payment
  await prisma.payment.create({
    data: {
      userId,
      amount: finalPrice,
      status: paymentStatus,
    },
  });

  if (paymentStatus !== PaymentStatus.SUCCESS) {
    throw new Error("Payment Failed");
  }

  // Calculate subscription end date
  const endDate = new Date(
    Date.now() + pricing.durationDays * 24 * 60 * 60 * 1000
  );

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      plan,                     // <-- ENUM STORED CORRECTLY
      startDate: new Date(),
      endDate,
      status: "ACTIVE",
    },
  });

  return { subscription, finalPrice };
};

const getMySubscription = async (userId: string) => {
  return prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { startDate: "desc" },
  });
};

export const SubscriptionService = {
  subscribe,
  getMySubscription,
};
