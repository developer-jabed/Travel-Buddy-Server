// import { Request, Response } from "express";
// import httpStatus from "http-status";
// import catchAsync from "../../../shared/catchAsync";
// import sendResponse from "../../../shared/sendResponse";
// import { ReportService } from "./report.service";

// export const createReport = catchAsync(async (req: Request, res: Response) => {
//   const report = await ReportService.createReport(req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: "Report created successfully",
//     data: report,
//   });
// });

// export const getAllReports = catchAsync(async (_req, res) => {
//   const reports = await ReportService.getAllReports();
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Reports retrieved successfully",
//     data: reports,
//   });
// });

// export const getReportById = catchAsync(async (req, res) => {
//   const report = await ReportService.getReportById(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Report retrieved successfully",
//     data: report,
//   });
// });

// export const updateReportStatus = catchAsync(async (req, res) => {
//   const report = await ReportService.updateReportStatus(req.params.id, req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Report status updated successfully",
//     data: report,
//   });
// });

// export const deleteReport = catchAsync(async (req, res) => {
//   const report =  await ReportService.deleteReport(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Report deleted successfully",
//     data: report,
//   });
// });
