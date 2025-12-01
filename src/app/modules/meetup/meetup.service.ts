import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { NotificationService } from "../notification/notification.service";

const createMeetup = async (userId: string, payload: any) => {
  const { tripId, title, date } = payload;
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new ApiError(httpStatus.NOT_FOUND, "Trip not found");
  if (trip.userId !== userId)
    throw new ApiError(httpStatus.FORBIDDEN, "Only the trip author can create a meetup");

  const duplicate = await prisma.meetup.findFirst({ where: { tripId, title, date: new Date(date) } });
  if (duplicate) throw new ApiError(httpStatus.BAD_REQUEST, "Meetup already exists");

  const meetup = await prisma.meetup.create({ data: { ...payload } });

  // Notify trip participants about new meetup
  await NotificationService.createNotification({
    type: "NEW_MEETUP",
    message: `New meetup created: ${title}`,
    link: `/meetups/${meetup.id}`,
    userId: trip.userId // or send to all trip followers
  });

  return meetup;
};

const getMeetups = async (tripId: string) => {
  return prisma.meetup.findMany({
    where: { tripId },
    include: { participants: true },
  });
};

const updateMeetup = async (userId: string, id: string, payload: any) => {
  const meetup = await prisma.meetup.findUnique({
    where: { id },
    include: { trip: true },
  });

  if (!meetup) throw new ApiError(404, "Meetup not found");

  if (meetup.trip?.userId !== userId) {
    throw new ApiError(403, "Only trip author can update meetup");
  }

    await NotificationService.createNotification({
    type: "NEW_MEETUP",
    message: `You are updated to meetup: ${meetup.title}`,
    userId: userId,
    link: `/meetups/${meetup.id}`
  });

  return prisma.meetup.update({
    where: { id },
    data: payload,
  });
};

const deleteMeetup = async (userId: string, id: string) => {
  const meetup = await prisma.meetup.findUnique({
    where: { id },
    include: { trip: true },
  });

  if (!meetup) throw new ApiError(404, "Meetup not found");

  if (meetup.trip?.userId !== userId) {
    throw new ApiError(403, "Only trip author can delete meetup");
  }

  await prisma.meetupParticipant.deleteMany({
    where: { meetupId: id },
  });

    await NotificationService.createNotification({
    type: "NEW_MEETUP",
    message: `You are deleted to meetup: ${meetup.title}`,
    userId: userId,
    link: `/meetups/${meetup.id}`
  });

  return prisma.meetup.delete({ where: { id } });
};

// ------------------------ PARTICIPANTS ------------------------

const addParticipant = async (userId: string, meetupId: string, participantId: string) => {
  const meetup = await prisma.meetup.findUnique({ where: { id: meetupId }, include: { trip: true } });
  if (!meetup) throw new ApiError(404, "Meetup not found");
  if (meetup.trip?.userId !== userId) throw new ApiError(403, "Only trip author can add participant");

  const exists = await prisma.meetupParticipant.findFirst({ where: { meetupId, userId: participantId } });
  if (exists) throw new ApiError(400, "User already a participant");

  const participant = await prisma.meetupParticipant.create({ data: { meetupId, userId: participantId } });

  // Notify participant
  await NotificationService.createNotification({
    type: "NEW_MEETUP",
    message: `You were added to meetup: ${meetup.title}`,
    userId: participantId,
    link: `/meetups/${meetup.id}`
  });

  return participant;
};

const removeParticipant = async (userId: string, meetupId: string, participantId: string) => {
  const meetup = await prisma.meetup.findUnique({
    where: { id: meetupId },
    include: { trip: true },
  });

  if (!meetup) throw new ApiError(404, "Meetup not found");

  if (meetup.trip?.userId !== userId) {
    throw new ApiError(403, "Only trip author can remove participant");
  }

    await NotificationService.createNotification({
    type: "NEW_MEETUP",
    message: `You were remove  from meetup: ${meetup.title}`,
    userId: participantId,
    link: `/meetups/${meetup.id}`
  });

  return prisma.meetupParticipant.deleteMany({
    where: { meetupId, userId: participantId },
  });
};

export const MeetupService = {
  createMeetup,
  getMeetups,
  updateMeetup,
  deleteMeetup,
  addParticipant,
  removeParticipant,
};
