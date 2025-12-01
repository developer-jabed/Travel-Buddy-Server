import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { ModeratorService } from "./moderator.service";
import { Request, RequestHandler, Response } from "express";
import pick from "../../../shared/pick";
import { moderatorFilterableFields } from "./moderator.constant";



const getAllFromDB: RequestHandler = catchAsync(
    async (req: Request, res: Response) => {
        const filters = pick(req.query, moderatorFilterableFields);

        const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

        const result = await ModeratorService.getAllModerators(filters, options);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Moderator data fetched!",
            meta: result.meta,
            data: result.data,
        });
    }
);

const getByIdFromDB = catchAsync(async (req, res) => {
    const result = await ModeratorService.getModeratorById(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Moderator retrieved successfully",
        data: result,
    });
});





const softDeleteFromDB = catchAsync(async (req, res) => {
    const result = await ModeratorService.softDeleteModerator(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Moderator soft-deleted successfully",
        data: result,
    });
});

export const ModeratorController = {
    getAllFromDB,
    getByIdFromDB,
    softDeleteFromDB,
};
