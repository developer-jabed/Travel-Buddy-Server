import { Router } from "express";
import { MeetupController } from "./meetup.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// 👉 Create Meetup (User + Admin)
router.post(
  "/",
  auth(UserRole.USER, UserRole.ADMIN),
  MeetupController.createMeetup
);

// 👉 Get ALL Meetups (Public or Auth — your choice)
router.get("/", MeetupController.getAllMeetups);

// 👉 Get Single Meetup (Public or Auth)
router.get("/:id", MeetupController.getMeetupById);

// 👉 Update Meetup (Only USER + ADMIN)
router.patch(
  "/:id",
  auth(UserRole.USER, UserRole.ADMIN),
  MeetupController.updateMeetup
);

// 👉 Delete Meetup (Only USER + ADMIN)
router.delete(
  "/:id",
  auth(UserRole.USER, UserRole.ADMIN),
  MeetupController.deleteMeetup
);

// 👉 Add a Participant (USER + ADMIN)
router.post(
  "/participant",
  auth(UserRole.USER, UserRole.ADMIN),
  MeetupController.addParticipant
);

// 👉 Remove Participant (USER + ADMIN)
router.delete(
  "/participant/:id",
  auth(UserRole.USER, UserRole.ADMIN),
  MeetupController.removeParticipant
);

// 👉 Get all participants of a meetup (Public or Auth)
router.get(
  "/participants/:meetupId",
  MeetupController.getParticipants
);

export const meetupRoute = router;
