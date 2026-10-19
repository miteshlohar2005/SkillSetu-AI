import mongoose from "mongoose";

const userAnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number },
  questionText: { type: String },
  selectedOption: { type: String },
  correctAnswer: { type: String },
  isCorrect: { type: Boolean },
  explanation: { type: String },
  topic: { type: String },
});

const topicAnalysisSchema = new mongoose.Schema({
  topic: { type: String },
  score: { type: Number },
  status: { type: String },
});

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizTitle: {
      type: String,
    },
    domain: {
      type: String,
    },
    topic: {
      type: String,
    },
    difficulty: {
      type: String,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    userAnswers: [userAnswerSchema],
    topicAnalysis: [topicAnalysisSchema],
    aiFeedback: {
      type: String,
      default: "",
    },
    passed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
