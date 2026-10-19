import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createChat,
  getChats,
  getChatById,
  deleteChat,
} from "../controller/chat.controller.js";

const chatRouter = express.Router();

chatRouter.post("/create", isAuth, createChat);
chatRouter.get("/get", isAuth, getChats);
chatRouter.get("/:id", isAuth, getChatById);
chatRouter.post("/delete", isAuth, deleteChat);
chatRouter.delete("/:id", isAuth, deleteChat);

export default chatRouter;
