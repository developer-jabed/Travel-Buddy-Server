import { Router } from "express";
import { MeetupController } from "./meetup.controller";

const router = Router();

// Meetup routes
router.post("/", MeetupController.createMeetup);
router.get("/", MeetupController.getAllMeetups);
router.get("/:id", MeetupController.getMeetupById);
router.put("/:id", MeetupController.updateMeetup);
router.delete("/:id", MeetupController.deleteMeetup);

// Participant routes
router.post("/participant", MeetupController.addParticipant);
router.delete("/participant/:id", MeetupController.removeParticipant);
router.get("/:meetupId/participants", MeetupController.getParticipants);

export default router;
