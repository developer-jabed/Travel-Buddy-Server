import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MeetupService } from "./meetup.service";

const createMeetup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await MeetupService.createMeetup(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Meetup created successfully",
    data: result,
  });
});

const getMeetups = catchAsync(async (req, res) => {
  const tripId = req.params.tripId;
  const result = await MeetupService.getMeetups(tripId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetups retrieved successfully",
    data: result,
  });
});

const updateMeetup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const meetupId = req.params.meetupId;

  const result = await MeetupService.updateMeetup(userId, meetupId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetup updated successfully",
    data: result,
  });
});

const deleteMeetup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const meetupId = req.params.meetupId;

  const result = await MeetupService.deleteMeetup(userId, meetupId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetup deleted successfully",
    data: result,
  });
});

// ------------------------ PARTICIPANTS ------------------------

const addParticipant = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const meetupId = req.params.meetupId;
  const participantId = req.body.userId;

  const result = await MeetupService.addParticipant(userId, meetupId, participantId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Participant added successfully",
    data: result,
  });
});

const removeParticipant = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const meetupId = req.params.meetupId;
  const participantId = req.body.userId;

  const result = await MeetupService.removeParticipant(userId, meetupId, participantId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Participant removed successfully",
    data: result,
  });
});

export const MeetupController = {
  createMeetup,
  getMeetups,
  updateMeetup,
  deleteMeetup,
  addParticipant,
  removeParticipant,
};
