import { Router } from "express";
import auth from "../../middlewares/auth";
import * as chatController from "./chat.controller";

const router = Router();

router.post("/", auth(), chatController.createChat);
router.post("/message", auth(), chatController.sendMessage);
router.get("/user", auth(), chatController.getUserChats);
router.get("/:chatId", auth(), chatController.getMessages);

export const chatRoutes = router;
