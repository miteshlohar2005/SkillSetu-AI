import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import Interview from "../models/interviewModel.js";
import User from "../models/userModel.js";
import { recalculateUserCompetencyAndGaps } from "../services/competencyCalculationService.js";
import { generateDiagnosticAssessmentsForUser } from "../services/diagnosticAssessmentService.js";

export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ messages: "Resume required" });
        }
        const filepath = req.file.path

        const fileBuffer = await fs.promises.readFile(filepath)
        const uint8Array = new Uint8Array(fileBuffer)

        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
        let resumeText = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const content = await page.getTextContent()

            const pageText = content.items.map((item) => item.str).join(" ")
            resumeText += pageText + "\n";
        }
        resumeText = resumeText.replace(/\s+/g, " ").trim()

        const messages = [
            {
                role: "system",
                content: `Extract structured data from resume.
                Return strictly JSON:{
                "role":"string",
                "experience": "string",
                "projects": ["project1", "project2"],
                "skills": ["skill1","skill2"]
                }`
            },
            {
                role: "user",
                content: resumeText
            }
        ]

        const aiResponse = await askAi(messages)

        const cleaned = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        fs.unlinkSync(filepath)

        res.json({
            role: parsed.role,
            experience: parsed.experience,
            projects: parsed.projects,
            skills: parsed.skills,
            resumeText
        })

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
        }
        return res.status(500).json({ message: error.message })
    }
}

export const generateQuestion = async (req, res) => {
    try {
        let { role, experience, mode, resumeText, projects, skills } = req.body

        role = role?.trim();
        experience = experience?.trim();
        mode = mode?.trim()

        if (!role || !experience || !mode) {
            return res.status(400).json({ messages: "Role, Experience and Mode are required." })
        }
        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({
                messages: "User not found"
            })
        }

        const projectText = Array.isArray(projects) && projects.length ? projects.join(",") : "None";

        const skillText = Array.isArray(skills) && skills.length ? skills.join(",") : "None";

        const safeResume = resumeText?.trim() || "None";

        const userPrompt = `
        Role:${role},
        Experience:${experience}
        InterviewMode: ${mode}
        Projects:${projectText}
        Skills:${skillText}
        Resume:${safeResume}
        `
        if (!userPrompt.trim()) {
            return res.status(400).json({
                messages: "Prompt content is empty."
            })
        }

        const messages = [
            {
                role: "system",
                content: `
                You are a real human interviewer conducting a professional interview.

                Speak in simple, natural English as if you are directly talking to the candidate.

                Generate exactly 5 interview questions.

            Strict Rules:
                - Each question must contain between 15 and 25 words.
                - Each question must be a single complete sentence.
                - Do NOT number them.
                - Do NOT add explanations.
                - Do NOT add extra text before or after.
                - One question per line only.
                - Keep language simple and conversational.
                - Questions must feel practical and realistic.

                Difficulty progression:
                Question 1 → easy  
                Question 2 → easy  
                Question 3 → medium  
                Question 4 → medium  
                Question 5 → hard  

            Make questions based on the candidate's role, experience,interviewMode, projects, skills, and resume details.`
            },
            {
                role: "user",
                content: userPrompt
            }
        ];

        const aiResponse = await askAi(messages)

        if (!aiResponse || !aiResponse.trim()) {
            return res.status(500).json({
                messages: "AI returned empty response."
            })
        }

        const questionsArray = aiResponse.split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, 5)

        if (questionsArray.length === 0) {
            return res.status(500).json({
                messages: "AI failed to generate questions."
            })
        }

        const interview = await Interview.create({
            userId: user._id,
            role, experience, mode,
            resumeText: safeResume,
            question: questionsArray.map((q, index) => ({
                question: q,
                difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
                timeLimit: [60, 60, 90, 90, 120][index]
            }))
        })

        res.json({
            interviewId: interview._id,
            creditsLeft: user.credits,
            username: user.name,
            question: interview.question
        })

    } catch (error) {
        return res.status(500).json({ message: `failed to create interview ${error.message}` })
    }
}

export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer, timeTaken } = req.body
        const interview = await Interview.findById(interviewId)
        const question = interview.question[questionIndex]

        if (!answer) {
            question.score = 0
            question.feedback = "You did not an answer.";
            question.answer = ""

            await interview.save()

            return res.json({
                feedback: question.feedback
            })
        }

        if (timeTaken > question.timeLimit) {
            question.score = 0;
            question.feedback = "time limit exceeded. Answer not evaluated.";
            question.answer = answer

            await interview.save()

            return res.json({
                feedback: question.feedback
            })
        }

        const messages = [
            {
                role: "system",
                content: `
            You are a professional human interviewer evaluating a candidate's answer in a real interview.

            Evaluate naturally and fairly, like a real person would.

            Score the answer in these areas (0 to 10):

        1. Confidence - Does the answer sound clear, confident, and well-presented?
        2. Communication - Is the language simple, clear, and easy to understand?
        3. Correctness - Is the answer accurate, relevant, and complete?

        Rules:
            - Be realistic and unbiased.
            - Do not give random high scores.
            - If the answer is weak, score low.
            - If the answer is strong and detailed, score high.
            - Consider clarity, structure, and relevance.

        Calculate:
            finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

        Feedback Rules:
            - Write natural human feedback.
            - 10 to 15 words only.
            - Sound like real interview feedback.
            - Can suggest improvement if needed.
            - Do NOT repeat the question.
            - Do NOT explain scoring.
            - Keep tone professional and honest.

            Return ONLY valid JSON in this format:

        {
            "confidence": number,
            "communication": number,
            "correctness": number,
            "finalScore": number,
            "feedback": "short human feedback"
        }`
            }
            ,
            {
                role: "user",
                content: `
        Question: ${question.question}
        Answer: ${answer}`
            }
        ];

        const aiResponse = await askAi(messages)

        const cleaned = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        question.answer = answer;
        question.confidence = parsed.confidence
        question.communication = parsed.communication
        question.correctness = parsed.correctness
        question.score = parsed.finalScore;
        question.feedback = parsed.feedback;
        await interview.save();

        return res.status(200).json({ feedback: parsed.feedback })
    } catch (error) {
        return res.status(500).json({ message: `failed to submit answer ${error.message}` })
    }
}

export const finishInterview = async (req, res) => {
    try {
        const { interviewId } = req.body
        const interview = await Interview.findById(interviewId)
        if (!interview) {
            return res.status(400).json({ message: "failed to find interview" })
        }
        const qList = Array.isArray(interview.question) ? interview.question : (Array.isArray(interview.questions) ? interview.questions : []);
        const totalQuestions = qList.length;

        let totalScore = 0;
        let totalConfidence = 0;
        let totalCommunication = 0;
        let totalCorrectness = 0;

        qList.forEach((q) => {
            totalScore += q.score || 0;
            totalConfidence += q.confidence || 0;
            totalCommunication += q.communication || 0;
            totalCorrectness += q.correctness || 0;
        });

        const finalScore = totalQuestions ? totalScore / totalQuestions : 0;
        const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
        const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;
        const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

        interview.status = "completed";
        interview.finalScore = finalScore;
        await interview.save();

        try {
            const user = await User.findById(interview.userId);
            if (user) {
                user.learningHours = (user.learningHours || 0) + 1;
                await user.save();
            }
            await recalculateUserCompetencyAndGaps(interview.userId);
        } catch (uErr) {
            console.error("Error updating user stats on finish interview:", uErr);
        }

        return res.status(200).json({
            success: true,
            interviewId: interview._id,
            finalScore: Number(finalScore.toFixed((1))),
            confidence: Number(avgConfidence.toFixed((1))),
            communication: Number(avgCommunication.toFixed((1))),
            correctness: Number(avgCorrectness.toFixed((1))),
            questionWiseScore: qList.map((q) => ({
                question: q.question,
                score: q.score || 0,
                feedback: q.feedback || "",
                confidence: q.confidence || 0,
                communication: q.communication || 0,
                correctness: q.correctness || 0,
            }))
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: `failed to finish interview ${error.message}` })
    }
}

export const getMyInterview = async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.userId })
            .select("role experience mode finalScore score status createdAt question questions resumeText isDiagnostic targetCadre")
            .sort({ isDiagnostic: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            interviews,
            count: interviews.length,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: `failed to find currentUser Interview ${error}` });
    }
}

export const getInterviewReport = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" })
        }
        const qList = Array.isArray(interview.question) ? interview.question : (Array.isArray(interview.questions) ? interview.questions : []);
        const totalQuestions = qList.length;

        let totalConfidence = 0;
        let totalCommunication = 0;
        let totalCorrectness = 0;

        qList.forEach((q) => {
            totalConfidence += q.confidence || 0;
            totalCommunication += q.communication || 0;
            totalCorrectness += q.correctness || 0;
        });

        const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
        const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;
        const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

        return res.status(200).json({
            _id: interview._id,
            role: interview.role,
            experience: interview.experience,
            mode: interview.mode,
            createdAt: interview.createdAt,
            finalScore: interview.finalScore,
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            question: qList,
            questions: qList,
            questionWiseScore: qList
        });

    } catch (error) {
        return res.status(500).json({ message: `failed to find currentUser Interview report ${error}` })
    }
}

export const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const interview = await Interview.findById(id);

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
            });
        }
        if (interview.userId.toString() !== req.userId) {
            return res.status(403).json({
                message: "Unauthorized access",
            });
        }
        await Interview.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Interview deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: `Failed to delete interview ${error}`,
        });
    }
};

export const getDiagnosticInterview = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let diagnosticInterview = await Interview.findOne({
            userId,
            isDiagnostic: true,
        });

        if (!diagnosticInterview || !Array.isArray(diagnosticInterview.question) || diagnosticInterview.question.length === 0) {
            const diag = await generateDiagnosticAssessmentsForUser(user);
            diagnosticInterview = diag?.diagnosticInterview || await Interview.findOne({ userId, isDiagnostic: true });
        }

        if (!diagnosticInterview) {
            return res.status(404).json({ success: false, message: "Diagnostic viva not found" });
        }

        if (req.query.reset === "true" || req.query.retake === "true") {
            diagnosticInterview.status = "Incompleted";
            diagnosticInterview.finalScore = 0;
            if (Array.isArray(diagnosticInterview.question)) {
                diagnosticInterview.question.forEach((q) => {
                    q.answer = "";
                    q.score = 0;
                    q.feedback = "";
                    q.confidence = 0;
                    q.communication = 0;
                    q.correctness = 0;
                });
            }
            await diagnosticInterview.save();
        }

        const qList = Array.isArray(diagnosticInterview.question) && diagnosticInterview.question.length
            ? diagnosticInterview.question
            : (Array.isArray(diagnosticInterview.questions) ? diagnosticInterview.questions : []);

        return res.status(200).json({
            success: true,
            interviewId: diagnosticInterview._id,
            creditsLeft: user.credits,
            username: user.name,
            question: qList,
            role: diagnosticInterview.role,
            status: diagnosticInterview.status,
            isDiagnostic: true,
        });
    } catch (error) {
        console.error("[GET DIAGNOSTIC INTERVIEW ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};