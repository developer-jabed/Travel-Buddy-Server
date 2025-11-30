interface CreateMeetupInput {
  tripId?: string;
  title: string;
  location: string;
  date: Date;
  description?: string;
}

interface AddParticipantInput {
  meetupId: string;
  userId: string;
}