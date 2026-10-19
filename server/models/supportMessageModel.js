import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["learner", "admin", "trainer"],
      default: "learner",
    },
    senderCadre: {
      type: String,
      default: "Statistical Officer",
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recipientName: {
      type: String,
      default: "NSSTA Secretariat & Faculty",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentData: {
      type: String,
      default: "",
    },
    attachmentName: {
      type: String,
      default: "",
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);
export default SupportMessage;
