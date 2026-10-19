import Quiz from "../models/quizModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import User from "../models/userModel.js";
import { generateQuiz, evaluateQuizSubmission, generateAdaptiveRecommendations } from "../services/aiService.js";
import { recalculateUserCompetencyAndGaps } from "../services/competencyCalculationService.js";
import { generateDiagnosticAssessmentsForUser } from "../services/diagnosticAssessmentService.js";

export const getDiagnosticQuiz = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let diagnosticQuiz = await Quiz.findOne({
            assignedTo: userId,
            isDiagnostic: true,
        });

        if (!diagnosticQuiz) {
            const diags = await generateDiagnosticAssessmentsForUser(user);
            diagnosticQuiz = diags?.diagnosticQuiz || await Quiz.findOne({ assignedTo: userId, isDiagnostic: true });
        }

        if (!diagnosticQuiz) {
            return res.status(404).json({ success: false, message: "Diagnostic quiz not found" });
        }

        return res.status(200).json({
            success: true,
            quiz: diagnosticQuiz,
        });
    } catch (error) {
        console.error("[GET DIAGNOSTIC QUIZ ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const generateAiQuiz = async (req, res) => {
    try {
        const { topic = "Sampling Techniques", domain = "Statistical Competencies", difficulty = "Medium", numQuestions = 5 } = req.body;
        const userId = req.userId || req.user?._id || null;

        const validDiff = ["Easy", "Medium", "Hard"].includes(difficulty) ? difficulty : "Medium";
        const count = Math.max(3, Math.min(20, Number(numQuestions) || 5));

        const generatedData = await generateQuiz({
            topic,
            domain,
            difficulty: validDiff,
            numQuestions: count,
        });

        const safeQuestions = (generatedData.questions || []).map((q, idx) => ({
            question: q.question || `Question ${idx + 1} on ${topic}`,
            options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : [
                `A) Standard concept in ${topic}`,
                `B) Alternative methodological convention`,
                `C) Secondary operational parameter`,
                `D) Non-applicable option`
            ],
            correctAnswer: (typeof q.correctAnswer === "string" && ["A", "B", "C", "D"].includes(q.correctAnswer.trim().toUpperCase()))
                ? q.correctAnswer.trim().toUpperCase()
                : "A",
            explanation: q.explanation || `Official guideline concept from NSSTA ${topic} framework.`,
            topic: q.topic || topic,
            difficulty: ["Easy", "Medium", "Hard"].includes(q.difficulty) ? q.difficulty : validDiff,
            sourceReference: q.sourceReference || `NSSTA ${topic} Guidelines`,
        }));

        const quiz = await Quiz.create({
            title: generatedData.title || `${topic} — Diagnostic Assessment`,
            domain: generatedData.domain || domain,
            topic: generatedData.topic || topic,
            difficulty: validDiff,
            timeLimitMinutes: generatedData.timeLimitMinutes || Math.max(5, count * 2),
            questions: safeQuestions,
            createdBy: userId,
            isGeneratedByAI: true,
            isPublished: true,
        });

        return res.status(201).json({
            success: true,
            message: `AI Quiz on ${topic} generated successfully! ✨`,
            quiz,
        });
    } catch (error) {
        console.error("[GENERATE QUIZ ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getQuizzes = async (req, res) => {
    try {
        const { domain, difficulty, topic, includeMastered } = req.query;
        const userId = req.userId || req.user?._id;
        const query = { isPublished: true };

        if (userId) {
            query.$or = [
                { isDiagnostic: false },
                { isDiagnostic: { $exists: false } },
                { isDiagnostic: true, assignedTo: userId },
            ];

            if (includeMastered !== "true") {
                const highScoringAttempts = await QuizAttempt.find({
                    userId,
                    $or: [
                        { score: { $gte: 75 } },
                        { accuracy: { $gte: 75 } },
                    ],
                }).select("quizId quizTitle score accuracy");

                const masteredIds = highScoringAttempts
                    .map((a) => a.quizId)
                    .filter(Boolean);
                const masteredTitles = highScoringAttempts
                    .map((a) => a.quizTitle?.trim())
                    .filter(Boolean);

                if (masteredIds.length > 0) {
                    query._id = { $nin: masteredIds };
                }
                if (masteredTitles.length > 0) {
                    query.title = { $nin: masteredTitles };
                }
            }
        } else {
            query.isDiagnostic = { $ne: true };
        }

        if (domain) query.domain = domain;
        if (difficulty) query.difficulty = difficulty;
        if (topic) query.topic = { $regex: topic, $options: "i" };

        const quizzes = await Quiz.find(query).sort({ isDiagnostic: -1, createdAt: -1 }).limit(50);

        return res.status(200).json({
            success: true,
            quizzes,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        return res.status(200).json({
            success: true,
            quiz,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const submitQuizAttempt = async (req, res) => {
    try {
        const { id } = req.params;
        const { userAnswers = [], timeTakenSeconds = 60, tabSwitchCount = 0 } = req.body;
        const userId = req.userId || req.user?._id;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        const evaluation = await evaluateQuizSubmission({
            questions: quiz.questions,
            userAnswers,
        });

        const attempt = await QuizAttempt.create({
            quizId: quiz._id,
            userId,
            quizTitle: quiz.title,
            domain: quiz.domain,
            topic: quiz.topic,
            difficulty: quiz.difficulty,
            score: evaluation.score,
            totalQuestions: evaluation.totalQuestions,
            correctCount: evaluation.correctCount,
            accuracy: evaluation.accuracy,
            timeTakenSeconds,
            tabSwitchCount: Math.max(0, Number(tabSwitchCount) || 0),
            userAnswers: evaluation.evaluatedQuestions,
            topicAnalysis: evaluation.topicAnalysis,
            passed: evaluation.passed,
            aiFeedback: evaluation.passed
                ? `Excellent performance in ${quiz.topic}. Demonstrated solid grasp of core principles.`
                : `Review recommended in ${quiz.topic}. Focus on foundational formulas and NSSTA methodology standards.`,
        });

        let user = await User.findById(userId);
        let adaptiveRecommendations = [];
        if (user) {
            user.quizzesCompleted = (user.quizzesCompleted || 0) + 1;
            user.learningHours = (user.learningHours || 0) + Math.max(0.25, Math.round((timeTakenSeconds / 3600) * 10) / 10);
            await user.save();

            try {
                const recalcResult = await recalculateUserCompetencyAndGaps(userId);
                if (recalcResult?.user) {
                    user = recalcResult.user;
                }
            } catch (recalcErr) {
                console.error("[QUIZ RECALCULATION ERROR]", recalcErr.message);
            }

            const weakTopics = evaluation.topicAnalysis?.filter((t) => t.status === "Needs Review").map((t) => t.topic) || [];
            if (weakTopics.length) {
                adaptiveRecommendations = await generateAdaptiveRecommendations({
                    weakTopics,
                    recentScores: [evaluation.score],
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Quiz submitted and evaluated successfully! 🎉",
            attempt,
            adaptiveRecommendations,
            user: user ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isProfileCompleted: Boolean(user.isProfileCompleted),
                profilePhoto: user.profilePhoto,
                designation: user.designation,
                department: user.department,
                jobRole: user.jobRole,
                competencies: user.competencies,
                skillGaps: user.skillGaps,
                learningPath: user.learningPath,
                overallCompetencyScore: user.overallCompetencyScore,
                overallLevel: user.overallLevel,
                learningStreak: user.learningStreak,
                learningHours: user.learningHours,
                quizzesCompleted: user.quizzesCompleted,
            } : null,
        });
    } catch (error) {
        console.error("[SUBMIT QUIZ ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyQuizAttempts = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const attempts = await QuizAttempt.find({ userId }).sort({ createdAt: -1 }).limit(100);

        return res.status(200).json({
            success: true,
            attempts,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
