import prisma from "../../../shared/prisma";
import { calculateFinalPrice } from "../../../utils/calcPrice";

const subscribe = async (userId: string, plan: string) => {
  const pricing = await prisma.subscriptionPlanPricing.findUnique({
    where: { plan: plan as any },
  });

  if (!pricing) throw new Error("Invalid subscription plan");

  // Calculate final price
  const finalPrice = calculateFinalPrice(
    pricing.basePrice,
    pricing.discountType ?? undefined,
    pricing.discountValue ?? undefined
  );

  // Calculate subscription end date
  const endDate = new Date(
    Date.now() + pricing.durationDays * 24 * 60 * 60 * 1000
  );

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      plan: plan as any,
      startDate: new Date(),
      endDate,
      status: "ACTIVE",
    },
  });

  return { subscription, finalPrice };
};

const getMySubscription = async (userId: string) => {
  return await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: {
      startDate: "desc",
    },
  });
};

export const SubscriptionService = {
  subscribe,
  getMySubscription,
};
