import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.subscriptionPlanPricing.upsert({
    where: { plan: "WEEKLY" },
    update: {},
    create: {
      plan: "WEEKLY",
      durationDays: 7,
      basePrice: 70,
      discountType: "PERCENTAGE",
      discountValue: 10,
      finalPrice: 2.7,
    },
  });

  await prisma.subscriptionPlanPricing.upsert({
    where: { plan: "MONTHLY" },
    update: {},
    create: {
      plan: "MONTHLY",
      durationDays: 30,
      basePrice: 300,
      discountType: "PERCENTAGE",
      discountValue: 20,
      finalPrice: 8,
    },
  });

  await prisma.subscriptionPlanPricing.upsert({
    where: { plan: "YEARLY" },
    update: {},
    create: {
      plan: "YEARLY",
      durationDays: 365,
      basePrice: 3000,
      discountType: "FIXED",
      discountValue: 20,
      finalPrice: 80,
    },
  });
}

main();
