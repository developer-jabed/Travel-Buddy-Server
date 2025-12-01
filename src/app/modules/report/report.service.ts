import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

interface CreateReportInput {
  reportedId: string;
  reason: string;
}

interface UpdateReportStatusInput {
  status: "PENDING" | "RESOLVED" | "REJECTED";
}

export const ReportService = {
  // Create report
  createReport: async (reporterId: string, data: CreateReportInput) => {
    const { reportedId, reason } = data;

    if (reporterId === reportedId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "You cannot report yourself");
    }

    // Prevent duplicate report
    const duplicate = await prisma.report.findFirst({
      where: {
        reporterId,
        reportedId,
        reason,
      },
    });

    if (duplicate) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You already reported this user for same reason"
      );
    }

    return prisma.report.create({
      data: {
        reporterId,
        reportedId,
        reason,
      },
    });
  },

  // Get all reports
  getAllReports: async () => {
    return prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: { reporter: true, reported: true },
    });
  },

  // Get report by ID
  getReportById: async (id: string) => {
    const report = await prisma.report.findUnique({
      where: { id },
      include: { reporter: true, reported: true },
    });

    if (!report) throw new ApiError(404, "Report not found");

    return report;
  },

  // Update report status
  updateReportStatus: async (id: string, data: UpdateReportStatusInput) => {
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) throw new ApiError(404, "Report not found");

    return prisma.report.update({
      where: { id },
      data,
    });
  },

  // Delete a report
  deleteReport: async (id: string) => {
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) throw new ApiError(404, "Report not found");

    return prisma.report.delete({ where: { id } });
  },
};
