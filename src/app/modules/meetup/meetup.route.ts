import express from "express";
import auth from "../../middlewares/auth";
import { MeetupController } from "./meetup.controller";

const router = express.Router();

// meetup
router.post("/", auth(), MeetupController.createMeetup);
router.get("/:tripId", auth(), MeetupController.getMeetups);
router.patch("/:meetupId", auth(), MeetupController.updateMeetup);
router.delete("/:meetupId", auth(), MeetupController.deleteMeetup);

// participants
router.post("/:meetupId/participants", auth(), MeetupController.addParticipant);
router.delete("/:meetupId/participants", auth(), MeetupController.removeParticipant);

export const MeetupRoutes = router;
