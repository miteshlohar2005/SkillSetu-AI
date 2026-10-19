import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  textMessageController,
  imageMessageController,
  publishImageController,
} from "../controller/message.controller.js";

const messageRouter = express.Router();

messageRouter.post("/text", isAuth, textMessageController);
messageRouter.post("/image", isAuth, imageMessageController);
messageRouter.post("/publish", isAuth, publishImageController);

export default messageRouter;
