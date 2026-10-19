import express from "express";
import isAuth from "../middleware/isAuth.js";
import { upload } from "../middleware/multer.js";
import {
  sendOfficerMessage,
  sendAdminReply,
  getOfficerMessages,
  getAdminConversationsList,
  getConversationForOfficer,
  broadcastAnnouncement,
  getBroadcastAnnouncements,
  deleteBroadcastAnnouncement,
} from "../controller/supportMessage.controller.js";

const supportRouter = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "trainer")) {
    return next();
  }
  return next();
};

supportRouter.post(
  "/officer/send",
  isAuth,
  upload.single("file"),
  sendOfficerMessage,
);
supportRouter.get("/officer/messages", isAuth, getOfficerMessages);
supportRouter.get("/broadcasts", isAuth, getBroadcastAnnouncements);

supportRouter.get(
  "/admin/conversations",
  isAuth,
  isAdmin,
  getAdminConversationsList,
);
supportRouter.get(
  "/admin/conversation/:officerId",
  isAuth,
  isAdmin,
  getConversationForOfficer,
);
supportRouter.get(
  "/admin/broadcasts",
  isAuth,
  isAdmin,
  getBroadcastAnnouncements,
);
supportRouter.post(
  "/admin/reply",
  isAuth,
  isAdmin,
  upload.single("file"),
  sendAdminReply,
);
supportRouter.post("/admin/broadcast", isAuth, isAdmin, broadcastAnnouncement);
supportRouter.delete(
  "/admin/broadcast/:id",
  isAuth,
  isAdmin,
  deleteBroadcastAnnouncement,
);

export default supportRouter;
