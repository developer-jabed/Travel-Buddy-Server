import prisma from "../../../shared/prisma";

interface CreateReportInput {
  reporterId: string;
  reportedId: string;
  reason: string;
}

interface UpdateReportStatusInput {
  status: "PENDING" | "RESOLVED" | "REJECTED";
}

export const ReportService = {
  createReport: async (data: CreateReportInput) => {
    return prisma.report.create({ data });
  },

  getAllReports: async () => {
    return prisma.report.findMany({
      include: { reporter: true, reported: true },
    });
  },

  getReportById: async (id: string) => {
    return prisma.report.findUnique({
      where: { id },
      include: { reporter: true, reported: true },
    });
  },

  updateReportStatus: async (id: string, data: UpdateReportStatusInput) => {
    return prisma.report.update({
      where: { id },
      data,
    });
  },

  deleteReport: async (id: string) => {
    return prisma.report.delete({ where: { id } });
  },
};
