import SupportMessage from "../models/supportMessageModel.js";
import User from "../models/userModel.js";

export const sendOfficerMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message content cannot be empty." });
    }

    const user = req.user;
    let attachmentData = "";
    let attachmentName = "";

    if (req.file) {
      const mimeType = req.file.mimetype || "application/octet-stream";
      attachmentData = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      attachmentName = req.file.originalname;
    }

    const newMessage = await SupportMessage.create({
      senderId: user._id,
      senderName: user.name || user.email || "Statistical Officer",
      senderRole: "learner",
      senderCadre: user.jobRole || user.designation || "Statistical Officer",
      recipientId: null,
      recipientName: "NSSTA Secretariat & Faculty",
      message: message.trim(),
      attachmentData,
      attachmentName,
      isBroadcast: false,
      isRead: false,
    });

    return res.status(201).json({
      success: true,
      message: "Message delivered to NSSTA Faculty.",
      chatMessage: newMessage,
    });
  } catch (error) {
    console.error("[OFFICER MESSAGE ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendAdminReply = async (req, res) => {
  try {
    const { officerId, message } = req.body;
    if (!officerId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Recipient and message are required.",
      });
    }

    const targetOfficer = await User.findById(officerId);
    if (!targetOfficer) {
      return res
        .status(404)
        .json({ success: false, message: "Officer not found." });
    }

    let attachmentData = "";
    let attachmentName = "";

    if (req.file) {
      const mimeType = req.file.mimetype || "application/octet-stream";
      attachmentData = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      attachmentName = req.file.originalname;
    }

    const newMessage = await SupportMessage.create({
      senderId: req.user._id,
      senderName: req.user.name || "NSSTA Secretariat & Faculty",
      senderRole: "admin",
      senderCadre: "Academy Faculty",
      recipientId: targetOfficer._id,
      recipientName:
        targetOfficer.name || targetOfficer.email || "Statistical Officer",
      message: message.trim(),
      attachmentData,
      attachmentName,
      isBroadcast: false,
      isRead: false,
    });

    return res.status(201).json({
      success: true,
      message: "Reply delivered to officer in real-time.",
      chatMessage: newMessage,
    });
  } catch (error) {
    console.error("[ADMIN REPLY ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOfficerMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    await SupportMessage.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } },
    );

    const messages = await SupportMessage.find({
      $or: [
        { senderId: userId },
        { recipientId: userId },
        { isBroadcast: true },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("[GET OFFICER MESSAGES ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminConversationsList = async (req, res) => {
  try {
    const messages = await SupportMessage.find({ isBroadcast: false })
      .sort({ createdAt: -1 })
      .limit(500);

    const officerMap = {};

    for (const msg of messages) {
      let officerId = null;
      if (msg.senderRole === "learner") {
        officerId = msg.senderId?.toString();
      } else if (msg.recipientId) {
        officerId = msg.recipientId?.toString();
      } else {
        officerId = msg.senderId?.toString();
      }

      if (!officerId) continue;

      if (!officerMap[officerId]) {
        let officerUser = null;
        try {
          officerUser = await User.findById(
            officerId,
            "name email jobRole department designation",
          );
        } catch (e) {
          console.log("User find error:", e);
        }

        officerMap[officerId] = {
          officerId,
          officerName:
            officerUser?.name || msg.senderName || "Statistical Officer",
          officerEmail: officerUser?.email || "",
          officerCadre:
            officerUser?.jobRole ||
            officerUser?.designation ||
            msg.senderCadre ||
            "Statistical Cadre",
          officerDepartment: officerUser?.department || "MoSPI Headquarters",
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          lastSenderRole: msg.senderRole,
          unreadCount: 0,
        };
      }

      if ((msg.senderRole === "learner" || !msg.recipientId) && !msg.isRead) {
        officerMap[officerId].unreadCount += 1;
      }
    }

    const conversations = Object.values(officerMap).sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
    );

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("[ADMIN CONVERSATIONS ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversationForOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;
    if (!officerId) {
      return res
        .status(400)
        .json({ success: false, message: "Officer ID is required." });
    }

    await SupportMessage.updateMany(
      {
        $or: [
          { senderId: officerId, senderRole: "learner" },
          { senderId: officerId, recipientId: null },
        ],
        isRead: false,
      },
      { $set: { isRead: true } },
    );

    const messages = await SupportMessage.find({
      $or: [{ senderId: officerId }, { recipientId: officerId }],
      isBroadcast: false,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("[GET CONVERSATION FOR OFFICER ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const broadcastAnnouncement = async (req, res) => {
  try {
    const { message, title = "Official NSSTA Announcement" } = req.body;
    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Announcement content required." });
    }

    const announcement = await SupportMessage.create({
      senderId: req.user._id,
      senderName: `NSSTA Secretariat - ${title}`,
      senderRole: "admin",
      senderCadre: "Official Broadcast",
      recipientId: null,
      recipientName: "All Cadre Officers",
      message: message.trim(),
      isBroadcast: true,
      isRead: false,
    });

    return res.status(201).json({
      success: true,
      message: "Announcement broadcasted to all cadre officers in real-time.",
      announcement,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBroadcastAnnouncements = async (req, res) => {
  try {
    const broadcasts = await SupportMessage.find({ isBroadcast: true })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      broadcasts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBroadcastAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Announcement ID is required." });
    }

    const broadcast = await SupportMessage.findOneAndDelete({
      _id: id,
      isBroadcast: true,
    });

    if (!broadcast) {
      return res
        .status(404)
        .json({ success: false, message: "Broadcast announcement not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Broadcast announcement deleted successfully.",
    });
  } catch (error) {
    console.error("[DELETE BROADCAST ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
