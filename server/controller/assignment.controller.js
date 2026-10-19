import { Assignment, AssignmentSubmission } from "../models/assignmentModel.js";
import User from "../models/userModel.js";
import { evaluateAssignmentSubmission } from "../services/aiService.js";
import { recalculateUserCompetencyAndGaps } from "../services/competencyCalculationService.js";

export const OFFICIAL_ASSIGNMENTS = [
    {
        _id: "asgn-stat-01",
        title: "Multistage Stratified Sampling Frame & Multiplier Estimation",
        domain: "Statistical Competencies",
        targetCompetency: "Sampling Techniques & Estimation",
        cadreTarget: "All Cadres (ISS / SSS / FOD)",
        difficulty: "Intermediate",
        estimatedHours: 4,
        scenario: `The National Sample Survey Office (NSSO) is conducting a socio-economic survey across 12 agro-climatic sub-strata. In District 'X', the sampling frame comprises 450 rural Census Enumeration Blocks (CEBs). You have been assigned as the Survey Statistician to formulate the Second Stage Stratification (SSS) design, specify probability proportional to size (PPS) sampling selection with replacement vs systematic sampling, and derive the multiplier formula for estimating total household expenditure with 10% non-response.`,
        instructions: [
            "1. Define the First Stage Units (FSUs) and Ultimate Stage Units (USUs) for the district frame.",
            "2. Propose a criteria-based Second Stage Stratification (SSS) of listed households (e.g., based on land ownership, relative affluence).",
            "3. State the exact mathematical formula for the stratum multiplier under circular systematic sampling.",
            "4. Specify the imputation strategy for 10% unit non-response in rural clusters.",
        ],
        rubric: [
            { criterion: "Sampling Design & Frame Specification", maxMarks: 25, description: "Correctness of FSU/USU identification and allocation." },
            { criterion: "Multiplier Derivation & Weighting Formula", maxMarks: 25, description: "Mathematical accuracy of design weights and multipliers." },
            { criterion: "Non-Response & Imputation Strategy", maxMarks: 25, description: "Methodological rigor in addressing missing household schedules." },
            { criterion: "Documentation & MoSPI Standards", maxMarks: 25, description: "Adherence to NSS standard operating procedures." },
        ],
        sampleDataOrReference: "NSS 79th Round Instruction Manual, Volume 1: Concepts and Definitions.",
    },
    {
        _id: "asgn-stat-02",
        title: "System of National Accounts (SNA 2008) GVA by Economic Activity",
        domain: "Statistical Competencies",
        targetCompetency: "National Accounts & GDP Compilation",
        cadreTarget: "Indian Statistical Service (ISS) / CSO",
        difficulty: "Advanced",
        estimatedHours: 5,
        scenario: `The Central Statistics Office (CSO) is revising quarterly Gross Value Added (GVA) estimates for the Manufacturing and Trade sectors. You have received raw Annual Survey of Industries (ASI) factory data and GSTN turnover aggregates. You must resolve discrepancies in Intermediate Consumption (IC), calculate Gross Output at basic prices, and evaluate the deflation technique using the Wholesale Price Index (WPI) vs Producer Price Index (PPI).`,
        instructions: [
            "1. Formulate the relationship between Gross Output, Intermediate Consumption, and GVA at basic prices under SNA 2008.",
            "2. Outline the double-deflation method vs single-deflation method and explain which is preferred for the manufacturing sector.",
            "3. Discuss how corporate financial filings (MCA-21) are linked with GSTN microdata for quarterly benchmark indicators.",
            "4. Provide policy guidance on treatment of subsidies and taxes on products.",
        ],
        rubric: [
            { criterion: "SNA 2008 Conceptual Accuracy", maxMarks: 25, description: "Understanding of GVA, GDP at market prices, and basic prices." },
            { criterion: "Deflation Methodology & Price Indices", maxMarks: 25, description: "Justification of single vs double deflation with WPI/CPI." },
            { criterion: "Administrative Data Linkage (MCA-21/GSTN)", maxMarks: 25, description: "Integration of administrative registries with survey aggregates." },
            { criterion: "Executive Policy Clarity", maxMarks: 25, description: "Clarity of economic recommendations for policy makers." },
        ],
        sampleDataOrReference: "MoSPI National Accounts Statistics (NAS) Sources & Methods 2020.",
    },
    {
        _id: "asgn-tech-01",
        title: "Automated Survey Data Cleaning & Microdata Imputation Pipeline",
        domain: "Technical & Computational Competencies",
        targetCompetency: "Statistical Computing & Automated Survey Data Processing",
        cadreTarget: "Data Scientists & Statistical Officers",
        difficulty: "Intermediate",
        estimatedHours: 4,
        scenario: `A state Directorate of Economics and Statistics (DES) collected 50,000 household survey records with 4% missing values in household monthly per capita expenditure (MPCE) and duplicate entries in rural cluster IDs. You are required to design an automated statistical validation pipeline that detects multivariate outliers using Mahalanobis distance, implements donor-based Hot-Deck imputation, and exports sanitized microdata dictionaries.`,
        instructions: [
            "1. Detail the data quality audit checks (range validation, logical consistency, duplicate block checks).",
            "2. Describe the mathematical formulation of Hot-Deck donor imputation for missing continuous survey variables.",
            "3. Outline the outlier detection strategy and criteria for winsorization vs trimming.",
            "4. Formulate the output metadata summary compliant with DDI (Data Documentation Initiative) standard.",
        ],
        rubric: [
            { criterion: "Data Cleaning & Validation Logic", maxMarks: 25, description: "Robustness of algorithmic checks for survey integrity." },
            { criterion: "Imputation & Statistical Estimation", maxMarks: 25, description: "Methodological correctness of donor imputation." },
            { criterion: "Outlier Handling & Boundary Cases", maxMarks: 25, description: "Balance between preserving variance and removing noise." },
            { criterion: "Reproducibility & Standards Compliance", maxMarks: 25, description: "Adherence to official microdata dissemination guidelines." },
        ],
        sampleDataOrReference: "UN National Quality Assurance Framework (UN-NQAF) Guidelines.",
    },
    {
        _id: "asgn-gov-01",
        title: "DPDP Act Compliance & Statistical Anonymization Audit",
        domain: "Digital Governance & Security",
        targetCompetency: "Data Privacy, Ethics & Anonymization",
        cadreTarget: "All Cadres / IT & Survey Divisions",
        difficulty: "Intermediate",
        estimatedHours: 3,
        scenario: `Under the Digital Personal Data Protection (DPDP) Act, MoSPI is preparing to release unit-level microdata from the Periodic Labour Force Survey (PLFS). You are tasked with conducting a Privacy Impact Assessment (PIA) and designing a Statistical Disclosure Control (SDC) workflow that applies k-anonymity (k=5) and perturbation to quasi-identifiers (District, Age, Occupation, Income) while preserving analytical utility.`,
        instructions: [
            "1. Identify the direct identifiers, quasi-identifiers, and sensitive attributes in household survey microdata.",
            "2. Specify the anonymization techniques (recoding, top-coding, microaggregation) applied to each variable.",
            "3. Formulate the k-anonymity verification metric and assess risk of re-identification.",
            "4. Draft a brief Data Release Protocol for academic and public access enclaves.",
        ],
        rubric: [
            { criterion: "Privacy Law & Regulatory Grounding", maxMarks: 25, description: "Compliance with DPDP Act and MoSPI Data Policy." },
            { criterion: "Statistical Disclosure Control (SDC) Rigor", maxMarks: 25, description: "Application of k-anonymity, l-diversity, and perturbation." },
            { criterion: "Information Loss vs Privacy Trade-off", maxMarks: 25, description: "Preservation of analytical utility in survey tables." },
            { criterion: "Governance & Access Protocol", maxMarks: 25, description: "Completeness of the data enclave access rules." },
        ],
        sampleDataOrReference: "MoSPI Microdata Dissemination Policy & DPDP Act 2023.",
    },
];

export const getAssignments = async (req, res) => {
    try {
        const { domain } = req.query;
        let baseAssignments = [...OFFICIAL_ASSIGNMENTS];

        let dbAssignments = [];
        try {
            const query = {
                $or: [
                    { assignedToUserId: req.user?._id },
                    { assignedToUserId: null },
                    { assignedCadre: "All" },
                    { assignedCadre: { $regex: req.user?.jobRole || "", $options: "i" } }
                ]
            };
            dbAssignments = await Assignment.find(query).lean();
        } catch (dbErr) {
            console.error("[DB ASSIGNMENTS FETCH ERROR]", dbErr);
        }

        let combined = [...dbAssignments, ...baseAssignments];

        if (domain && domain !== "All") {
            combined = combined.filter((a) => a.domain.toLowerCase().includes(domain.toLowerCase()));
        }

        let userSubmissions = [];
        if (req.user?._id) {
            userSubmissions = await AssignmentSubmission.find({ userId: req.user._id }).lean();
        }

        const enriched = combined.map((asgn) => {
            const asgnId = asgn._id?.toString() || asgn.id;
            const submission = userSubmissions.find((s) => s.assignmentId === asgnId || s.assignmentTitle === asgn.title);
            const isExpired = asgn.dueDate ? new Date() > new Date(asgn.dueDate) : false;
            return {
                ...asgn,
                _id: asgnId,
                isExpired,
                hasSubmitted: !!submission,
                submission: submission || null,
            };
        });

        res.json({
            success: true,
            count: enriched.length,
            assignments: enriched,
        });
    } catch (err) {
        console.error("[GET ASSIGNMENTS ERROR]", err);
        res.status(500).json({ success: false, message: "Error fetching assignments" });
    }
};

export const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        let assignment = OFFICIAL_ASSIGNMENTS.find((a) => a._id === id);

        if (!assignment) {
            try {
                assignment = await Assignment.findById(id).lean();
            } catch (err) {
            }
        }

        if (!assignment) {
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        const isExpired = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;

        let submission = null;
        if (req.user?._id) {
            submission = await AssignmentSubmission.findOne({
                userId: req.user._id,
                $or: [{ assignmentId: id }, { assignmentTitle: assignment.title }],
            }).lean();
        }

        res.json({
            success: true,
            assignment: {
                ...assignment,
                isExpired,
            },
            submission,
        });
    } catch (err) {
        console.error("[GET ASSIGNMENT BY ID ERROR]", err);
        res.status(500).json({ success: false, message: "Error fetching assignment details" });
    }
};

export const submitAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { submissionText } = req.body;
        const userId = req.user?._id;

        if (!submissionText || submissionText.trim().length < 50) {
            return res.status(400).json({
                success: false,
                message: "Please provide a comprehensive submission of at least 50 characters.",
            });
        }

        let assignment = OFFICIAL_ASSIGNMENTS.find((a) => a._id === id);
        if (!assignment) {
            try {
                assignment = await Assignment.findById(id).lean();
            } catch (err) {}
        }

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found.",
            });
        }

        if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
            return res.status(400).json({
                success: false,
                message: "Submission deadline has expired. This case study is no longer accepting submissions.",
                isExpired: true,
                dueDate: assignment.dueDate,
            });
        }

        const user = await User.findById(userId);

        const evaluation = await evaluateAssignmentSubmission({
            assignment,
            submissionText,
            learnerProfile: user || {},
        });

        const submission = await AssignmentSubmission.create({
            userId,
            assignmentId: id,
            assignmentTitle: assignment.title,
            targetCompetency: assignment.targetCompetency,
            submissionText,
            status: "evaluated",
            aiEvaluation: evaluation,
        });

        if (user) {
            user.learningHours = (user.learningHours || 0) + (assignment.estimatedHours || 3);
            await user.save();

            try {
                const recalcResult = await recalculateUserCompetencyAndGaps(userId);
                if (recalcResult?.user) {
                    user = recalcResult.user;
                }
            } catch (recalcErr) {
                console.error("[ASSIGNMENT RECALCULATION ERROR]", recalcErr.message);
            }
        }

        res.json({
            success: true,
            message: "Assignment evaluated successfully by SkillSetu AI Engine!",
            submission,
            evaluation,
            user: user ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
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
    } catch (err) {
        console.error("[SUBMIT ASSIGNMENT ERROR]", err);
        res.status(500).json({ success: false, message: "Error submitting and evaluating assignment." });
    }
};

export const getMySubmissions = async (req, res) => {
    try {
        const userId = req.user?._id;
        const submissions = await AssignmentSubmission.find({ userId }).sort({ createdAt: -1 }).lean();

        res.json({
            success: true,
            count: submissions.length,
            submissions,
        });
    } catch (err) {
        console.error("[GET MY SUBMISSIONS ERROR]", err);
        res.status(500).json({ success: false, message: "Error fetching user submissions" });
    }
};

export default {
    getAssignments,
    getAssignmentById,
    submitAssignment,
    getMySubmissions,
};
