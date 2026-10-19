import Material from "../models/materialModel.js";
import MaterialRequest from "../models/materialRequestModel.js";
import Quiz from "../models/quizModel.js";
import SupportMessage from "../models/supportMessageModel.js";
import { generateMCQsFromText } from "../services/aiService.js";
import { extractTextFromFile } from "../utils/documentExtractor.js";

export const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a file to upload (PDF, PPT/PPTX, DOCX, TXT, CSV, or Image).",
      });
    }

    const {
      title,
      domain = "Statistical Competencies",
      topic = "Survey Methodology",
      autoGenerateMcqs = "false",
      difficulty = "Medium",
      numQuestions = "all",
    } = req.body;

    const fileExt = req.file.originalname.split(".").pop().toLowerCase();
    const mimeType = req.file.mimetype || "application/octet-stream";
    const fileBase64 = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;

    const extractedText = await extractTextFromFile(
      req.file.buffer,
      req.file.originalname,
      mimeType,
    );

    const material = await Material.create({
      title: title || req.file.originalname,
      originalName: req.file.originalname,
      fileType: fileExt,
      fileSize: req.file.size,
      fileData: fileBase64,
      domain,
      topic,
      extractedText:
        extractedText ||
        `Official Reference Material: ${title || req.file.originalname}. Domain: ${domain}, Topic: ${topic}.`,
      summary: `Learning material covering ${topic} (${domain}) extracted from ${req.file.originalname}.`,
      uploadedBy: req.userId || req.user?._id,
    });

    let generatedMcqs = [];
    let createdQuiz = null;

    if (autoGenerateMcqs === "true" || autoGenerateMcqs === true) {
      const textToUse =
        extractedText && extractedText.length > 50
          ? extractedText
          : `Official Training Manual on ${material.topic} under ${material.domain}. Survey guidelines, data verification, sampling frames, and estimation principles.`;

      generatedMcqs = await generateMCQsFromText({
        textContent: textToUse,
        documentTitle: material.title,
        domain: material.domain,
        topic: material.topic,
        numQuestions:
          numQuestions === "all" ? "all" : Number(numQuestions) || "all",
        difficulty,
        mode: numQuestions === "all" || !numQuestions ? "all" : "fixed",
        fileData: fileBase64,
        fileType: fileExt,
      });

      if (generatedMcqs && generatedMcqs.length > 0) {
        const userId = req.userId || req.user?._id || null;
        createdQuiz = await Quiz.create({
          title: `${material.title} - Exhaustive Diagnostic Quiz`,
          domain: material.domain,
          topic: material.topic,
          difficulty,
          questions: generatedMcqs.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation:
              q.explanation || "Official statistical guideline concept.",
            topic: q.topic || material.topic,
            sourceReference: q.sourceReference || material.title,
            difficulty: q.difficulty || difficulty,
          })),
          isOfficial: false,
          sourceMaterialId: material._id,
          createdBy: userId,
          timeLimitMinutes: Math.max(5, generatedMcqs.length * 2),
          isGeneratedByAI: true,
          isPublished: true,
        });

        material.generatedMCQsCount = generatedMcqs.length;
        await material.save();
      }
    }

    try {
      await SupportMessage.create({
        senderId: req.userId || req.user?._id || material.uploadedBy,
        senderName: "NSSTA Secretariat - Study Materials Repository",
        senderRole: "admin",
        senderCadre: "Official Broadcast",
        recipientId: null,
        recipientName: "All Cadre Officers",
        message: `📚 New Training Material Uploaded: "${material.title}" (${domain} • ${topic}). Access and practice with AI-generated diagnostics in Study Materials Hub.`,
        isBroadcast: true,
        isRead: false,
      });
    } catch (msgErr) {
      console.error("[UPLOAD MATERIAL NOTIFICATION ERROR]", msgErr);
    }

    return res.status(201).json({
      success: true,
      message:
        generatedMcqs.length > 0
          ? `Learning material uploaded & extracted! Generated ${generatedMcqs.length} diagnostic MCQs! ✨`
          : "Learning material uploaded and extracted successfully! ✨",
      material,
      mcqs: generatedMcqs,
      quiz: createdQuiz,
    });
  } catch (error) {
    console.error("[UPLOAD MATERIAL ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const generateMcqsFromMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const {
      numQuestions = "all",
      difficulty = "Medium",
      mode = "all",
    } = req.body;

    const material = await Material.findById(materialId);
    if (!material) {
      return res
        .status(404)
        .json({ success: false, message: "Material not found" });
    }

    const textToUse =
      material.extractedText && material.extractedText.length > 50
        ? material.extractedText
        : `Official Training Manual on ${material.topic} under ${material.domain}. Principles of official survey statistics, sampling frames, and national account compilations.`;

    const isAllMode =
      mode === "all" || numQuestions === "all" || Number(numQuestions) >= 20;

    const mcqs = await generateMCQsFromText({
      textContent: textToUse,
      documentTitle: material.title || material.originalName,
      domain: material.domain,
      topic: material.topic,
      numQuestions: isAllMode ? "all" : Number(numQuestions) || 5,
      difficulty,
      mode: isAllMode ? "all" : "fixed",
      fileData: material.fileData || "",
      fileType: material.fileType || "",
    });

    const userId = req.userId || req.user?._id || material.uploadedBy || null;
    const quiz = await Quiz.create({
      title: `${material.title} - Diagnostic Assessment`,
      domain: material.domain,
      topic: material.topic,
      difficulty,
      questions: mcqs.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "Official statistical guideline concept.",
        topic: q.topic || material.topic,
        sourceReference: q.sourceReference || material.title,
        difficulty: q.difficulty || difficulty,
      })),
      isOfficial: false,
      sourceMaterialId: material._id,
      createdBy: userId,
      timeLimitMinutes: Math.max(5, mcqs.length * 2),
      isGeneratedByAI: true,
      isPublished: true,
    });

    material.generatedMCQsCount =
      (material.generatedMCQsCount || 0) + mcqs.length;
    await material.save();

    return res.status(200).json({
      success: true,
      message: `Successfully generated ${mcqs.length} comprehensive diagnostic MCQs!`,
      mcqs,
      quiz,
    });
  } catch (error) {
    console.error("[GENERATE MCQS FROM MATERIAL ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 }).limit(40);
    return res.status(200).json({
      success: true,
      materials,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res
        .status(404)
        .json({ success: false, message: "Material not found" });
    }
    return res.status(200).json({
      success: true,
      material,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const requestMaterial = async (req, res) => {
  try {
    const { topic, domain, description, urgency = "Normal" } = req.body;
    if (!topic || !description) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please specify both the topic and detailed requirements.",
        });
    }

    const user = req.user;
    let attachmentData = "";
    let attachmentName = "";

    if (req.file) {
      const mimeType = req.file.mimetype || "application/octet-stream";
      attachmentData = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      attachmentName = req.file.originalname;
    }

    const newRequest = await MaterialRequest.create({
      requesterId: user._id,
      requesterName: user.name || "Statistical Officer",
      requesterEmail: user.email,
      requesterCadre: user.jobRole || "Statistical Officer",
      requesterDepartment: user.department || "MoSPI Headquarters",
      topic: topic.trim(),
      domain: domain || "Statistical Competencies",
      description: description.trim(),
      urgency,
      attachmentData,
      attachmentName,
      status: "pending",
    });

    try {
      await SupportMessage.create({
        senderId: user._id,
        senderName: user.name || "Statistical Officer",
        senderRole: "learner",
        senderCadre: user.jobRole || "Cadre Officer",
        recipientId: null,
        recipientName: "NSSTA Secretariat & Faculty",
        message: `📄 New Study Material Requisition: "${topic.trim()}" (${urgency} Priority) requested by ${user.name || "Statistical Officer"}. Requires dispatch in Study Material Hub.`,
        isBroadcast: false,
        isRead: false,
      });
    } catch (msgErr) {
      console.error("[REQUEST MATERIAL NOTIFICATION ERROR]", msgErr);
    }

    return res.status(201).json({
      success: true,
      message:
        "Study material request successfully submitted to the Academy Secretariat.",
      request: newRequest,
    });
  } catch (error) {
    console.error("[REQUEST MATERIAL ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyMaterialRequests = async (req, res) => {
  try {
    const requests = await MaterialRequest.find({
      requesterId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
