import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MeetupService } from "./meetup.service";

// Create a meetup
 const createMeetup = catchAsync(async (req: Request, res: Response) => {
  const meetup = await MeetupService.createMeetup(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Meetup created successfully",
    data: meetup,
  });
});

// Get all meetups
 const getAllMeetups = catchAsync(async (_req: Request, res: Response) => {
  const meetups = await MeetupService.getAllMeetups();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetups retrieved successfully",
    data: meetups,
  });
});

// Get meetup by ID
 const getMeetupById = catchAsync(async (req: Request, res: Response) => {
  const meetup = await MeetupService.getMeetupById(req.params.id);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetup retrieved successfully",
    data: meetup,
  });
});

// Update meetup
 const updateMeetup = catchAsync(async (req: Request, res: Response) => {
  const meetup = await MeetupService.updateMeetup(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetup updated successfully",
    data: meetup,
  });
});

// Delete meetup
 const deleteMeetup = catchAsync(async (req: Request, res: Response) => {
const meetup=  await MeetupService.deleteMeetup(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetup deleted successfully",
    data: meetup,
  });
});

// Add participant
 const addParticipant = catchAsync(async (req: Request, res: Response) => {
  const participant = await MeetupService.addParticipant(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Participant added successfully",
    data: participant,
  });
});

// Remove participant
 const removeParticipant = catchAsync(async (req: Request, res: Response) => {
   const meetup = await MeetupService.removeParticipant(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Participant removed successfully",
    data: meetup,
  });
});

// Get participants of a meetup
 const getParticipants = catchAsync(async (req: Request, res: Response) => {
  const participants = await MeetupService.getParticipants(req.params.meetupId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Participants retrieved successfully",
    data: participants,
  });
});

export const MeetupController = {
    createMeetup,
    getAllMeetups,
    getMeetupById,
    updateMeetup,
    deleteMeetup,
    addParticipant,
    removeParticipant,
    getParticipants
}