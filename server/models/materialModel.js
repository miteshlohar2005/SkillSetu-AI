import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileData: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      default: "pdf",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    domain: {
      type: String,
      default: "Statistical Competencies",
    },
    topic: {
      type: String,
      default: "Survey Methodologies",
    },
    extractedText: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    keyConcepts: {
      type: [String],
      default: [],
    },
    generatedMCQsCount: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const Material = mongoose.model("Material", materialSchema);
export default Material;
