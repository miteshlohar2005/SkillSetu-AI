import User from "../models/userModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import Material from "../models/materialModel.js";
import MaterialRequest from "../models/materialRequestModel.js";
import Interview from "../models/interviewModel.js";
import { Assignment, AssignmentSubmission } from "../models/assignmentModel.js";
import SupportMessage from "../models/supportMessageModel.js";

export const getAdminOverviewMetrics = async (req, res) => {
    try {
        const learnerRoleFilter = { role: { $nin: ["admin", "trainer"] } };
        const totalLearners = await User.countDocuments(learnerRoleFilter);
        const verifiedLearners = await User.countDocuments({ emailVerified: true, ...learnerRoleFilter });
        const totalQuizzesAttempted = await QuizAttempt.countDocuments();
        const totalInterviews = await Interview.countDocuments();
        const totalMaterials = await Material.countDocuments();
        const pendingMaterialRequests = await MaterialRequest.countDocuments({ status: "pending" });
        const totalSubmissions = await AssignmentSubmission.countDocuments();

        const users = await User.find(learnerRoleFilter, "department jobRole overallCompetencyScore overallLevel learningHours quizzesCompleted skillGaps competencies");

        const userIds = (users || []).map((u) => u._id);
        const completedInterviews = await Interview.find({
            userId: { $in: userIds },
            status: "completed",
        }).select("userId");
        const completedVivaUserIds = new Set(completedInterviews.map((iv) => iv.userId.toString()));

        let sumScore = 0;
        let sumHours = 0;
        const departmentMap = {};
        const cadreMap = {};
        const gapCounts = {};

        (users || []).forEach((u) => {
            const hasCompletedViva = completedVivaUserIds.has(u._id.toString());
            const userScore = hasCompletedViva
                ? (u.overallCompetencyScore !== undefined && u.overallCompetencyScore !== null ? u.overallCompetencyScore : 0)
                : 0;
            sumScore += userScore;
            sumHours += u.learningHours || 0;

            const dept = u.department || "MoSPI Headquarters";
            departmentMap[dept] = (departmentMap[dept] || 0) + 1;

            const cadre = u.jobRole || "Statistical Officer";
            cadreMap[cadre] = (cadreMap[cadre] || 0) + 1;

            if (u.skillGaps && Array.isArray(u.skillGaps)) {
                u.skillGaps.forEach((g) => {
                    if (g && g.competencyName) {
                        gapCounts[g.competencyName] = (gapCounts[g.competencyName] || 0) + 1;
                    }
                });
            }
        });

        const avgCompetency = (users && users.length) ? Math.round(sumScore / users.length) : 0;

        const topDeficits = Object.keys(gapCounts)
            .map((k) => ({ competencyName: k, count: gapCounts[k] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        const departmentDistribution = Object.keys(departmentMap).map((d) => ({
            name: d,
            learners: departmentMap[d],
        }));

        const cadreDistribution = Object.keys(cadreMap).map((c) => ({
            cadre: c,
            officers: cadreMap[c],
        }));

        return res.status(200).json({
            success: true,
            metrics: {
                totalLearners: totalLearners || 1,
                verifiedLearners: verifiedLearners || 1,
                avgCompetency,
                totalLearningHours: sumHours,
                totalQuizzesAttempted,
                totalInterviews,
                totalMaterials,
                pendingMaterialRequests,
                totalSubmissions,
                departmentDistribution,
                cadreDistribution,
                topDeficits,
            },
        });
    } catch (error) {
        console.error("[ADMIN OVERVIEW ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getLearnersDirectory = async (req, res) => {
    try {
        const { search = "", department = "", cadre = "" } = req.query;
        const query = {
            role: { $nin: ["admin", "trainer"] },
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (department) query.department = department;
        if (cadre) query.jobRole = cadre;

        const learners = await User.find(query, "-password -otpHash")
            .sort({ createdAt: -1 })
            .limit(60);

        const learnerIds = learners.map((l) => l._id);
        const completedInterviews = await Interview.find({
            userId: { $in: learnerIds },
            status: "completed",
        }).select("userId");
        const completedVivaUserIds = new Set(completedInterviews.map((iv) => iv.userId.toString()));

        const learnersWithVivaStatus = learners.map((l) => {
            const lObj = l.toObject();
            const hasCompletedViva = completedVivaUserIds.has(l._id.toString());
            lObj.hasCompletedViva = hasCompletedViva;

            if (!hasCompletedViva) {
                lObj.overallCompetencyScore = 0;
                lObj.overallLevel = "Novice (Viva Pending)";
            }
            return lObj;
        });

        return res.status(200).json({
            success: true,
            learners: learnersWithVivaStatus,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
    
export const getLearnerDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const learner = await User.findById(id, "-password -otpHash");
        if (!learner) {
            return res.status(404).json({ success: false, message: "Officer not found." });
        }

        const [interviews, quizAttempts, submissions, materialRequests] = await Promise.all([
            Interview.find({ userId: id }).sort({ createdAt: -1 }).limit(20),
            QuizAttempt.find({ userId: id }).sort({ createdAt: -1 }).limit(30),
            AssignmentSubmission.find({ userId: id }).sort({ createdAt: -1 }).limit(20),
            MaterialRequest.find({ requesterId: id }).sort({ createdAt: -1 }).limit(20),
        ]);

        const hasCompletedQuiz = Boolean(
            (quizAttempts && quizAttempts.length > 0) ||
            (learner.quizzesCompleted && learner.quizzesCompleted > 0)
        );
        const hasCompletedInterview = Boolean(
            interviews && interviews.some((i) => i.status === "completed" || i.finalScore || i.score)
        );
        const isDiagnosticCompleted = hasCompletedQuiz && hasCompletedInterview;

        const learnerObj = learner.toObject();
        if (!hasCompletedInterview) {
            learnerObj.overallCompetencyScore = 0;
            learnerObj.overallLevel = "Novice (Viva Pending)";
        }

        return res.status(200).json({
            success: true,
            learner: learnerObj,
            interviews,
            quizAttempts,
            submissions,
            materialRequests,
            isDiagnosticCompleted,
            hasCompletedQuiz,
            hasCompletedInterview,
            hasCompletedViva: hasCompletedInterview,
        });
    } catch (error) {
        console.error("[GET LEARNER DETAIL ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllMaterialRequests = async (req, res) => {
    try {
        const { status = "" } = req.query;
        const query = {};
        if (status && status !== "all") query.status = status;

        const requests = await MaterialRequest.find(query)
            .populate("requesterId", "name email jobRole department")
            .sort({ createdAt: -1 })
            .limit(60);

        return res.status(200).json({
            success: true,
            requests,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const fulfillMaterialRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            adminResponseNote,
            dispatchedMaterialTitle,
            dispatchedMaterialUrl,
            dispatchedMaterialText,
            status = "fulfilled",
        } = req.body;

        const request = await MaterialRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found." });
        }

        let fileData = "";
        let fileName = "";
        let fileType = "";

        if (req.file) {
            const mimeType = req.file.mimetype || "application/octet-stream";
            fileData = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
            fileName = req.file.originalname;
            fileType = req.file.originalname.split(".").pop().toLowerCase();
        }

        request.status = status;
        request.adminResponseNote = adminResponseNote || "Dispatched by NSSTA Secretariat.";
        request.dispatchedMaterialTitle = dispatchedMaterialTitle || request.topic;
        request.dispatchedMaterialUrl = dispatchedMaterialUrl || "";
        request.dispatchedMaterialText = dispatchedMaterialText || "";
        if (fileData) {
            request.dispatchedFileData = fileData;
            request.dispatchedFileName = fileName;
            request.dispatchedFileType = fileType;
        }
        const now = new Date();
        request.fulfilledAt = now;
        request.completedAt = now;
        request.resolvedAt = now;

        await request.save();

        try {
            if (request.requesterId) {
                const reqUser = await User.findById(request.requesterId);
                await SupportMessage.create({
                    senderId: req.user._id,
                    senderName: "NSSTA Secretariat - Material Request Desk",
                    senderRole: "admin",
                    senderCadre: "Official Secretariat",
                    recipientId: request.requesterId,
                    recipientName: reqUser?.name || request.requesterName || "Statistical Officer",
                    message: `📄 Your Study Material Request has been fulfilled: "${request.dispatchedMaterialTitle || request.topic}". Note: ${request.adminResponseNote || "Dispatched by NSSTA Secretariat."}. Access the material in your Study Materials Hub.`,
                    isBroadcast: false,
                    isRead: false,
                });
            }
        } catch (msgErr) {
            console.error("[MATERIAL FULFILL NOTIFICATION ERROR]", msgErr);
        }

        return res.status(200).json({
            success: true,
            message: "Study material request updated and dispatched to the officer.",
            request,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const dispatchMaterial = async (req, res) => {
    try {
        const {
            title,
            domain = "Statistical Competencies",
            topic = "General Statistics",
            targetUserId = null,
            targetCadre = "All",
            description,
            materialText = "",
            fileUrl = "",
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: "Title and description are required." });
        }

        let fileData = "";
        let fileName = title;
        let fileType = "pdf";

        if (req.file) {
            const mimeType = req.file.mimetype || "application/octet-stream";
            fileData = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
            fileName = req.file.originalname;
            fileType = req.file.originalname.split(".").pop().toLowerCase();
        }

        let directTargetUser = null;
        if (targetUserId) {
            directTargetUser = await User.findById(targetUserId);
            if (directTargetUser) {
                await MaterialRequest.create({
                    requesterId: directTargetUser._id,
                    requesterName: directTargetUser.name,
                    requesterEmail: directTargetUser.email,
                    requesterCadre: directTargetUser.jobRole,
                    requesterDepartment: directTargetUser.department,
                    topic: title,
                    domain,
                    description: `Direct administrative dispatch for ${targetCadre}`,
                    status: "fulfilled",
                    adminResponseNote: description,
                    dispatchedMaterialTitle: title,
                    dispatchedMaterialUrl: fileUrl,
                    dispatchedMaterialText: materialText,
                    dispatchedFileData: fileData,
                    dispatchedFileName: fileName,
                    dispatchedFileType: fileType,
                    fulfilledAt: new Date(),
                    completedAt: new Date(),
                    resolvedAt: new Date(),
                });
            }
        }

        const material = await Material.create({
            title,
            originalName: fileName || title,
            fileUrl,
            fileData,
            fileType,
            domain,
            topic,
            extractedText: materialText || description,
            summary: description,
            uploadedBy: req.user._id,
        });

        try {
            if (targetUserId && directTargetUser) {
                await SupportMessage.create({
                    senderId: req.user._id,
                    senderName: "NSSTA Secretariat - Study Material Hub",
                    senderRole: "admin",
                    senderCadre: "Official Secretariat",
                    recipientId: directTargetUser._id,
                    recipientName: directTargetUser.name || directTargetUser.email || "Statistical Officer",
                    message: `📚 New Study Material Dispatched: "${title}" (${domain} • ${topic}). ${description ? `Summary: ${description}. ` : ""}Available now in your Study Materials Hub.`,
                    isBroadcast: false,
                    isRead: false,
                });
            } else {
                const targetLabel = targetCadre === "All" ? "All Cadre Officers" : `${targetCadre} Officers`;
                await SupportMessage.create({
                    senderId: req.user._id,
                    senderName: `NSSTA Secretariat - Study Material Alert [${targetCadre}]`,
                    senderRole: "admin",
                    senderCadre: "Official Broadcast",
                    recipientId: null,
                    recipientName: targetLabel,
                    message: `📚 New Study Material Dispatched: "${title}" (${domain} • ${topic}). ${description ? `Summary: ${description}. ` : ""}Access full reference material in the Study Materials section.`,
                    isBroadcast: true,
                    isRead: false,
                });
            }
        } catch (msgErr) {
            console.error("[DISPATCH MATERIAL NOTIFICATION ERROR]", msgErr);
        }

        return res.status(201).json({
            success: true,
            message: "Study material successfully dispatched and archived.",
            material,
        });
    } catch (error) {
        console.error("[DISPATCH MATERIAL ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const dispatchAssignment = async (req, res) => {
    try {
        const {
            title,
            domain = "Statistical Competencies",
            targetCompetency,
            assignedCadre = "All",
            assignedToUserId = null,
            difficulty = "Intermediate",
            scenario,
            instructions = [],
            rubric = [],
            estimatedHours = 4,
            dueDate = null,
            adminNotes = "",
        } = req.body;

        if (!title || !targetCompetency || !scenario) {
            return res.status(400).json({
                success: false,
                message: "Please provide assignment title, target competency, and detailed scenario.",
            });
        }

        const formattedInstructions = Array.isArray(instructions) && instructions.length
            ? instructions
            : [
                "1. Analyze the institutional context and data specifications.",
                "2. Formulate your mathematical and analytical solution according to official standards.",
                "3. Provide executive recommendations for policy or survey field implementation."
            ];

        const formattedRubric = Array.isArray(rubric) && rubric.length
            ? rubric
            : [
                { criterion: "Methodological Soundness", maxMarks: 25, description: "Correct application of national statistical frameworks." },
                { criterion: "Analytical & Computational Rigor", maxMarks: 25, description: "Mathematical accuracy and data integrity." },
                { criterion: "Adherence to MoSPI Standards", maxMarks: 25, description: "Compliance with NSS/CSO standard operating procedures." },
                { criterion: "Executive Clarity & Policy Value", maxMarks: 25, description: "Quality of synthesized insights." }
            ];

        const assignment = await Assignment.create({
            title,
            domain,
            targetCompetency,
            cadreTarget: assignedCadre,
            difficulty,
            scenario,
            instructions: formattedInstructions,
            rubric: formattedRubric,
            estimatedHours,
            isCustomDispatched: true,
            assignedBy: req.user._id,
            assignedToUserId: assignedToUserId || null,
            assignedCadre,
            dueDate: dueDate ? new Date(dueDate) : null,
            adminNotes,
        });

        try {
            const formattedDueDate = dueDate
                ? new Date(dueDate).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
                : "Open submission (No timer limit)";

            if (assignedToUserId) {
                const targetOfficer = await User.findById(assignedToUserId);
                if (targetOfficer) {
                    await SupportMessage.create({
                        senderId: req.user._id,
                        senderName: "NSSTA Secretariat - Case Study Assignment",
                        senderRole: "admin",
                        senderCadre: "Official Secretariat",
                        recipientId: targetOfficer._id,
                        recipientName: targetOfficer.name || targetOfficer.email || "Statistical Officer",
                        message: `📋 New Case Study Assigned: "${title}" (${domain} • ${targetCompetency}). Deadline: ${formattedDueDate}. Please review scenario and submit your response in Assignments.`,
                        isBroadcast: false,
                        isRead: false,
                    });
                }
            } else {
                const targetLabel = assignedCadre === "All" ? "All Cadre Officers" : `${assignedCadre} Officers`;
                await SupportMessage.create({
                    senderId: req.user._id,
                    senderName: `NSSTA Secretariat - Case Study Alert [${assignedCadre}]`,
                    senderRole: "admin",
                    senderCadre: "Official Broadcast",
                    recipientId: null,
                    recipientName: targetLabel,
                    message: `📋 New Case Study Dispatched: "${title}" [Domain: ${domain} | Target: ${assignedCadre}]. Deadline: ${formattedDueDate}. Head over to Assignments to review and solve.`,
                    isBroadcast: true,
                    isRead: false,
                });
            }
        } catch (msgErr) {
            console.error("[DISPATCH ASSIGNMENT NOTIFICATION ERROR]", msgErr);
        }

        return res.status(201).json({
            success: true,
            message: `Custom case study successfully assigned to ${assignedCadre}.`,
            assignment,
        });
    } catch (error) {
        console.error("[DISPATCH ASSIGNMENT ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllAssignmentSubmissions = async (req, res) => {
    try {
        const submissions = await AssignmentSubmission.find()
            .populate("userId", "name email jobRole department overallCompetencyScore")
            .sort({ createdAt: -1 })
            .limit(60);

        return res.status(200).json({
            success: true,
            submissions,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllDispatchedAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find()
            .populate("assignedBy", "name email")
            .populate("assignedToUserId", "name email jobRole")
            .sort({ createdAt: -1 })
            .lean();

        const assignmentsWithCounts = await Promise.all(
            assignments.map(async (asgn) => {
                const subCount = await AssignmentSubmission.countDocuments({
                    $or: [
                        { assignmentId: asgn._id.toString() },
                        { assignmentTitle: asgn.title },
                    ],
                });
                const isExpired = asgn.dueDate ? new Date() > new Date(asgn.dueDate) : false;
                return {
                    ...asgn,
                    submissionsCount: subCount,
                    isExpired,
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: assignmentsWithCounts.length,
            assignments: assignmentsWithCounts,
        });
    } catch (error) {
        console.error("[GET DISPATCHED ASSIGNMENTS ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDispatchedAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: "Case study assignment not found." });
        }

        await Assignment.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: `Case study "${assignment.title}" deleted successfully.`,
        });
    } catch (error) {
        console.error("[DELETE DISPATCHED ASSIGNMENT ERROR]", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getDepartmentHeatmap = async (req, res) => {
    try {
        const heatmap = [
            { department: "National Accounts Division (NAD)", statistical: 84, technical: 68, digitalGov: 72, managerial: 80 },
            { department: "Field Operations Division (FOD)", statistical: 76, technical: 58, digitalGov: 78, managerial: 70 },
            { department: "Economic Statistics Division (ESD)", statistical: 82, technical: 74, digitalGov: 70, managerial: 75 },
            { department: "Survey Design & Research (SDRD)", statistical: 88, technical: 79, digitalGov: 75, managerial: 78 },
            { department: "State DES / Line Ministries", statistical: 68, technical: 52, digitalGov: 65, managerial: 66 },
        ];

        return res.status(200).json({
            success: true,
            heatmap,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

