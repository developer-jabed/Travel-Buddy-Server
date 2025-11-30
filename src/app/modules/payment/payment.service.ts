import prisma from "../../../shared/prisma";

interface CreatePaymentInput {
  userId: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
}

interface UpdatePaymentInput {
  amount?: number;
  status?: "PENDING" | "SUCCESS" | "FAILED";
}

export const PaymentService = {
  createPayment: async (data: CreatePaymentInput) => {
    return prisma.payment.create({ data });
  },

  getAllPayments: async () => {
    return prisma.payment.findMany({ include: { user: true } });
  },

  getPaymentById: async (id: string) => {
    return prisma.payment.findUnique({ where: { id }, include: { user: true } });
  },

  updatePayment: async (id: string, data: UpdatePaymentInput) => {
    return prisma.payment.update({ where: { id }, data });
  },

  deletePayment: async (id: string) => {
    return prisma.payment.delete({ where: { id } });
  },
};
