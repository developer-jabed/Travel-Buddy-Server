import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

export const MeetupService = {
  // Create a meetup
 createMeetup: async (data: CreateMeetupInput, userId: string) => {
    // Check if trip exists and verify author
    const trip = await prisma.trip.findUnique({
      where: { id: data.tripId },
    });

    if (!trip) {
      throw new ApiError(httpStatus.NOT_FOUND, "Trip not found");
    }

    // Only trip author can create meetup
    if (trip. userId!== userId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Only the trip creator can create meetups"
      );
    }

    return prisma.meetup.create({
      data,
    });
  },

  // Other service functions remain same...

  // Get all meetups
  getAllMeetups: async () => {
    return prisma.meetup.findMany({
      include: {
        participants: true,
      },
    });
  },

  // Get a meetup by ID
  getMeetupById: async (id: string) => {
    return prisma.meetup.findUnique({
      where: { id },
      include: { participants: true },
    });
  },

  // Update a meetup
  updateMeetup: async (id: string, data: Partial<CreateMeetupInput>) => {
    return prisma.meetup.update({
      where: { id },
      data,
    });
  },

  // Delete a meetup
  deleteMeetup: async (id: string) => {
    return prisma.meetup.delete({
      where: { id },
    });
  },

  // Add participant
  // 👉 Add Participant (only trip author)
  addParticipant: async (data: AddParticipantInput, userId: string) => {
    const meetup = await prisma.meetup.findUnique({
      where: { id: data.meetupId },
      include: { trip: true },
    });

    if (!meetup) {
      throw new ApiError(httpStatus.NOT_FOUND, "Meetup not found");
    }

    // Check trip author
    if (meetup.trip?.userId !== userId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Only the trip creator can add participants"
      );
    }

    return prisma.meetupParticipant.create({
      data,
    });
  },

  // Remove participant
  removeParticipant: async (participantId: string, userId: string) => {
    const participant = await prisma.meetupParticipant.findUnique({
      where: { id: participantId },
      include: {
        meetup: {
          include: {
            trip: true,
          },
        },
      },
    });

    if (!participant) {
      throw new ApiError(httpStatus.NOT_FOUND, "Participant not found");
    }

    // Check trip author
    if (participant.meetup.trip?.userId !== userId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Only the trip creator can remove participants"
      );
    }

    return prisma.meetupParticipant.delete({
      where: { id: participantId },
    });
  },

  // Get participants of a meetup
  getParticipants: async (meetupId: string) => {
    return prisma.meetupParticipant.findMany({
      where: { meetupId },
      include: { user: true },
    });
  },
};
