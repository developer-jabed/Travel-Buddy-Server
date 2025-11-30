import prisma from "../../../shared/prisma";


export const MeetupService = {
  // Create a meetup
  createMeetup: async (data: CreateMeetupInput) => {
    return prisma.meetup.create({
      data,
    });
  },

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
  addParticipant: async (data: AddParticipantInput) => {
    return prisma.meetupParticipant.create({
      data,
    });
  },

  // Remove participant
  removeParticipant: async (id: string) => {
    return prisma.meetupParticipant.delete({
      where: { id },
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
