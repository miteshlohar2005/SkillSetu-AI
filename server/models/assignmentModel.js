import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      required: true,
      enum: [
        "Statistical Competencies",
        "Technical & Computational Competencies",
        "Digital Governance & Security",
        "Behavioural & Managerial Competencies",
      ],
      default: "Statistical Competencies",
    },
    targetCompetency: {
      type: String,
      required: true,
    },
    cadreTarget: {
      type: String,
      default: "All Cadres (ISS / SSS / FOD)",
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
    scenario: {
      type: String,
      required: true,
    },
    instructions: [
      {
        type: String,
      },
    ],
    rubric: [
      {
        criterion: { type: String, required: true },
        maxMarks: { type: Number, default: 25 },
        description: { type: String },
      },
    ],
    estimatedHours: {
      type: Number,
      default: 4,
    },
    sampleDataOrReference: {
      type: String,
    },
    isCustomDispatched: {
      type: Boolean,
      default: false,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedCadre: {
      type: String,
      default: "All",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignmentId: {
      type: String,
      required: true,
    },
    assignmentTitle: {
      type: String,
    },
    targetCompetency: {
      type: String,
    },
    submissionText: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["submitted", "evaluated"],
      default: "evaluated",
    },
    aiEvaluation: {
      overallScore: { type: Number, default: 0 },
      grade: { type: String, default: "B" },
      rubricScores: [
        {
          criterion: String,
          score: Number,
          maxScore: Number,
          feedback: String,
        },
      ],
      strengths: [String],
      improvementAreas: [String],
      detailedFeedback: String,
      suggestedNextSteps: [String],
      competencyScoreDelta: { type: Number, default: 5 },
    },
  },
  { timestamps: true },
);

export const Assignment = mongoose.model("Assignment", assignmentSchema);
export const AssignmentSubmission = mongoose.model(
  "AssignmentSubmission",
  submissionSchema,
);

export default { Assignment, AssignmentSubmission };
