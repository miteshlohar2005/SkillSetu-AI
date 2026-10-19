import User from "../models/userModel.js";
import Quiz from "../models/quizModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import Interview from "../models/interviewModel.js";
import { AssignmentSubmission } from "../models/assignmentModel.js";
import {
  COMPETENCY_DOMAINS,
  ROLE_BENCHMARK_PROFILES,
} from "../config/competencyFramework.js";
import {
  generateCompetencyAssessment,
  analyzeSkillGaps,
  generateLearningPath,
} from "../services/aiService.js";
import { getIgotCourses } from "../services/igotService.js";
import { getTpacProgrammes } from "../services/tpacService.js";
import {
  recalculateUserCompetencyAndGaps,
  scoreToLevel,
  levelToScore,
} from "../services/competencyCalculationService.js";
import { generateDiagnosticAssessmentsForUser } from "../services/diagnosticAssessmentService.js";

export const getCompetencyFramework = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      domains: COMPETENCY_DOMAINS,
      benchmarks: ROLE_BENCHMARK_PROFILES,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLearnerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId || req.user?._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        jobRole: user.jobRole,
        currentAssignment: user.currentAssignment,
        educationalQualification: user.educationalQualification,
        workExperience: user.workExperience,
        previousTraining: user.previousTraining,
        competencies: user.competencies || [],
        skillGaps: user.skillGaps || [],
        learningPath: user.learningPath || [],
        overallCompetencyScore: user.overallCompetencyScore !== undefined && user.overallCompetencyScore !== null ? user.overallCompetencyScore : 0,
        overallLevel: user.overallLevel || "Novice",
        learningStreak: user.learningStreak !== undefined && user.learningStreak !== null ? user.learningStreak : 0,
        learningHours: user.learningHours || 0,
        quizzesCompleted: user.quizzesCompleted || 0,
        credits: user.credits !== undefined ? user.credits : 100,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLearnerProfile = async (req, res) => {
  try {
    const {
      designation,
      department,
      jobRole,
      currentAssignment,
      educationalQualification,
      workExperience,
      previousTraining,
    } = req.body;
    const user = await User.findById(req.userId || req.user?._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (designation) user.designation = designation;
    if (department) user.department = department;
    if (jobRole) user.jobRole = jobRole;
    if (currentAssignment) user.currentAssignment = currentAssignment;
    if (educationalQualification)
      user.educationalQualification = educationalQualification;
    if (workExperience !== undefined)
      user.workExperience = Number(workExperience);
    if (previousTraining)
      user.previousTraining = Array.isArray(previousTraining)
        ? previousTraining
        : [previousTraining];

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const runAiAssessment = async (req, res) => {
  try {
    const { selfRatings = {} } = req.body;
    const user = await User.findById(req.userId || req.user?._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const assessmentResult = await generateCompetencyAssessment({
      profile: {
        designation: user.designation,
        department: user.department,
        jobRole: user.jobRole,
        workExperience: user.workExperience,
        educationalQualification: user.educationalQualification,
        previousTraining: user.previousTraining,
      },
      selfRatings,
      quizHistory: [],
    });

    user.competencies = assessmentResult.competencies;
    user.overallCompetencyScore = assessmentResult.overallScore;
    user.overallLevel = assessmentResult.overallLevel;

    const gapAnalysis = await analyzeSkillGaps({
      currentCompetencies: user.competencies,
      targetRole: user.jobRole,
      department: user.department,
    });

    user.skillGaps = gapAnalysis.skillGaps;

    const igotCourses = await getIgotCourses();
    const tpacProgrammes = getTpacProgrammes();
    const allAvailable = [
      ...igotCourses.map((c) => ({
        id: c.id,
        title: c.title,
        provider: c.provider,
        skillAddressed: c.skillAddressed,
        duration: c.duration,
      })),
      ...tpacProgrammes.map((p) => ({
        id: p.id,
        title: p.title,
        provider: "NSSTA TPAC",
        skillAddressed: p.competencyAddressed,
        duration: `${p.durationWeeks} Weeks`,
      })),
    ];

    const pathResult = await generateLearningPath({
      competencyGaps: user.skillGaps,
      jobRole: user.jobRole,
      department: user.department,
      availableCourses: allAvailable,
    });

    const sanitizedPath = (pathResult.learningPath || []).map((step, idx) => ({
      step: Number(step.step) || idx + 1,
      title: step.title || `Module ${idx + 1}`,
      provider: step.provider || "iGOT Karmayogi",
      skillAddressed: step.skillAddressed || "Statistical Competencies",
      duration: step.duration || "12 Hours",
      currentLevel: step.currentLevel || "Beginner",
      targetLevel: step.targetLevel || "Intermediate",
      priority: ["High", "Medium", "Low"].includes(step.priority)
        ? step.priority
        : "Medium",
      rationale:
        step.rationale || "Official competency capacity building module.",
      status: ["in-progress", "completed", "not-started", "pending"].includes(
        step.status,
      )
        ? step.status
        : idx === 0
          ? "in-progress"
          : "not-started",
      externalUrl: step.externalUrl || "",
    }));

    user.learningPath = sanitizedPath;
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Competency assessment & skill-gap analysis completed successfully! ✨",
      assessment: assessmentResult,
      skillGaps: user.skillGaps,
      learningPath: user.learningPath,
      overallScore: user.overallCompetencyScore,
      overallLevel: user.overallLevel,
      user: {
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
      },
    });
  } catch (error) {
    console.error("[RUN AI ASSESSMENT ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const checkCompetencyMatch = (compName = "", testStr = "") => {
  if (!compName || !testStr) return false;
  const c1 = compName.toLowerCase();
  const c2 = testStr.toLowerCase();
  if (c1.includes(c2) || c2.includes(c1)) return true;
  const t1 = c1.split(/[\s,&/()\-]+/).filter((w) => w.length > 3);
  const t2 = c2.split(/[\s,&/()\-]+/).filter((w) => w.length > 3);
  return t1.some((tok) => t2.includes(tok));
};

export const getDetailedSkillGapAnalysis = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.competencies || user.competencies.length === 0) {
      try {
        const recalc = await recalculateUserCompetencyAndGaps(userId);
        if (recalc?.user) {
          user = recalc.user;
        }
      } catch (rErr) {
        console.warn("[SKILL GAP RECALCULATE WARN]", rErr.message);
      }
    }
    const targetCadre =
      req.query.cadre ||
      user.targetCadre ||
      user.jobRole ||
      "Indian Statistical Service (ISS) Officer";

    const benchmark =
      ROLE_BENCHMARK_PROFILES[targetCadre] ||
      ROLE_BENCHMARK_PROFILES["Indian Statistical Service (ISS) Officer"] ||
      { minScore: 70, requiredLevels: {} };

    const requiredLevels = benchmark.requiredLevels || {};
    const availableCadres = Object.keys(ROLE_BENCHMARK_PROFILES);

    const allQuizzes = await Quiz.find({ isDiagnostic: { $ne: true } })
      .select("_id title topic domain difficulty questions")
      .limit(60);

    const igotCourses = await getIgotCourses();

    const requiredSkillsList = [];
    const userComps = user.competencies || [];

    for (const [reqSkillName, reqLevelStr] of Object.entries(requiredLevels)) {
      const targetScore = levelToScore(reqLevelStr);

      let userComp = userComps.find(
        (c) => c.competencyName.toLowerCase() === reqSkillName.toLowerCase()
      );
      if (!userComp) {
        userComp = userComps.find((c) =>
          checkCompetencyMatch(reqSkillName, c.competencyName)
        );
      }

      let compDomain = "Statistical Competencies";
      for (const dom of COMPETENCY_DOMAINS) {
        if (
          dom.competencies.some(
            (c) =>
              c.name.toLowerCase() === reqSkillName.toLowerCase() ||
              checkCompetencyMatch(reqSkillName, c.name)
          )
        ) {
          compDomain = dom.name;
          break;
        }
      }

      const currentScore = userComp ? Math.min(100, Math.max(0, userComp.score || 0)) : 0;
      const currentLevel = userComp ? userComp.level || scoreToLevel(currentScore) : "Novice";
      const deltaScore = currentScore - targetScore;
      const gapScore = Math.max(0, targetScore - currentScore);

      let category = "NEEDS_IMPROVEMENT";
      let priority = "Medium";
      let impact = "Capability meets standard operational guidelines.";
      let recommendedAction = `Reinforce practical knowledge in ${reqSkillName}.`;

      if (currentScore >= targetScore) {
        category = "ON_TARGET";
        priority = "Satisfied";
        impact = `Fully meets official MoSPI cadre benchmark standards for ${targetCadre}.`;
        recommendedAction = "Maintain operational proficiency with periodic refresher evaluations.";
      } else if (gapScore >= 20 || currentScore < 45) {
        category = "CRITICAL";
        priority = "High";
        impact = `Critical capability deficit directly impacting statutory survey data integrity and official reporting for ${targetCadre}.`;
        recommendedAction = `Immediate remediation recommended: Complete NSSTA core practicum and diagnostic drills in ${reqSkillName}.`;
      } else {
        category = "NEEDS_IMPROVEMENT";
        priority = gapScore >= 10 ? "Medium" : "Low";
        impact = `Moderate operational gap in ${reqSkillName} requiring targeted exercises and revision.`;
        recommendedAction = `Practice focused MCQ drills and review official MoSPI guidelines for ${reqSkillName}.`;
      }

      const isStrong = currentScore >= 80 || deltaScore >= 5;

      const matchingQuizzes = allQuizzes
        .filter(
          (q) =>
            checkCompetencyMatch(reqSkillName, q.topic) ||
            checkCompetencyMatch(reqSkillName, q.title) ||
            checkCompetencyMatch(compDomain, q.domain)
        )
        .slice(0, 3)
        .map((q) => ({
          _id: q._id,
          title: q.title,
          topic: q.topic,
          difficulty: q.difficulty,
          questionsCount: q.questions?.length || 5,
        }));

      const matchingCourses = igotCourses
        .filter(
          (c) =>
            checkCompetencyMatch(reqSkillName, c.skillAddressed) ||
            checkCompetencyMatch(reqSkillName, c.title)
        )
        .slice(0, 2)
        .map((c) => ({
          id: c.id,
          title: c.title,
          provider: c.provider,
          duration: c.duration,
          url: c.url,
        }));

      requiredSkillsList.push({
        competencyName: reqSkillName,
        domain: compDomain,
        targetLevel: reqLevelStr,
        targetScore,
        currentScore,
        currentLevel,
        deltaScore,
        gapScore,
        category,
        isStrong,
        priority,
        impact,
        recommendedAction,
        source: userComp?.source || "assessment-derived",
        suggestedQuizzes: matchingQuizzes,
        suggestedCourses: matchingCourses,
      });
    }

    const priorityOrder = { High: 3, Medium: 2, Low: 1, Satisfied: 0 };
    requiredSkillsList.sort(
      (a, b) =>
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0) ||
        b.gapScore - a.gapScore
    );

    const skillsOnTarget = requiredSkillsList.filter((s) => s.currentScore >= s.targetScore);
    const requiredSkills = requiredSkillsList;
    const skillGaps = requiredSkillsList.filter((s) => s.gapScore > 0);
    const strongSkills = requiredSkillsList.filter((s) => s.isStrong);
    const needsImprovement = requiredSkillsList.filter(
      (s) => s.category === "NEEDS_IMPROVEMENT"
    );
    const criticalGaps = requiredSkillsList.filter(
      (s) => s.category === "CRITICAL"
    );
    const totalRequiredCount = requiredSkillsList.length;
    const onTargetCount = skillsOnTarget.length;
    const cadreComplianceRate =
      totalRequiredCount > 0
        ? Math.round((onTargetCount / totalRequiredCount) * 100)
        : 0;

    const totalGapSum = skillGaps.reduce((sum, g) => sum + g.gapScore, 0);
    const averageGapScore =
      skillGaps.length > 0 ? Math.round(totalGapSum / skillGaps.length) : 0;

    return res.status(200).json({
      success: true,
      cadre: targetCadre,
      availableCadres,
      benchmarkMinScore: benchmark.minScore || 70,
      userProfile: {
        _id: user._id,
        name: user.name,
        designation: user.designation,
        department: user.department,
        jobRole: user.jobRole,
        targetCadre: user.targetCadre,
        overallCompetencyScore: user.overallCompetencyScore || 0,
        overallLevel: user.overallLevel || "Novice",
        quizzesCompleted: user.quizzesCompleted || 0,
        learningHours: user.learningHours || 0,
      },
      summary: {
        totalRequiredSkills: totalRequiredCount,
        skillsOnTargetCount: onTargetCount,
        strongSkillsCount: strongSkills.length,
        needsImprovementCount: needsImprovement.length,
        criticalGapsCount: criticalGaps.length,
        cadreComplianceRate,
        averageGapScore,
      },
      skillsOnTarget,
      requiredSkills,
      skillGaps,
      strongSkills,
      needsImprovement,
      criticalGaps,
    });
  } catch (error) {
    console.error("[DETAILED SKILL GAP ANALYSIS ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSkillGaps = async (req, res) => {
  try {
    const user = await User.findById(req.userId || req.user?._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      skillGaps: user.skillGaps || [],
      jobRole: user.jobRole,
      department: user.department,
      overallLevel: user.overallLevel,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const generatePathway = async (req, res) => {
  try {
    const user = await User.findById(req.userId || req.user?._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const igotCourses = await getIgotCourses();
    const tpacProgrammes = getTpacProgrammes();
    const allAvailable = [
      ...igotCourses.map((c) => ({
        id: c.id,
        title: c.title,
        provider: c.provider,
        skillAddressed: c.skillAddressed,
        duration: c.duration,
      })),
      ...tpacProgrammes.map((p) => ({
        id: p.id,
        title: p.title,
        provider: "NSSTA TPAC",
        skillAddressed: p.competencyAddressed,
        duration: `${p.durationWeeks} Weeks`,
      })),
    ];

    const pathResult = await generateLearningPath({
      competencyGaps: user.skillGaps || [],
      jobRole: user.jobRole,
      department: user.department,
      availableCourses: allAvailable,
    });

    const sanitizedPath = (pathResult.learningPath || []).map((step, idx) => ({
      step: Number(step.step) || idx + 1,
      title: step.title || `Module ${idx + 1}`,
      provider: step.provider || "iGOT Karmayogi",
      skillAddressed: step.skillAddressed || "Statistical Competencies",
      duration: step.duration || "12 Hours",
      currentLevel: step.currentLevel || "Beginner",
      targetLevel: step.targetLevel || "Intermediate",
      priority: ["High", "Medium", "Low"].includes(step.priority)
        ? step.priority
        : "Medium",
      rationale:
        step.rationale || "Official competency capacity building module.",
      status: ["in-progress", "completed", "not-started", "pending"].includes(
        step.status,
      )
        ? step.status
        : idx === 0
          ? "in-progress"
          : "not-started",
      externalUrl: step.externalUrl || "",
    }));

    user.learningPath = sanitizedPath;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Personalized learning pathway generated successfully.",
      learningPath: user.learningPath,
      pathwayTitle: pathResult.pathwayTitle,
      estimatedTotalHours: pathResult.estimatedTotalHours,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePathwayProgress = async (req, res) => {
  try {
    const { stepIndex, status } = req.body;
    const user = await User.findById(req.userId || req.user?._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const targetStatus = [
      "completed",
      "in-progress",
      "not-started",
      "pending",
    ].includes(status)
      ? status
      : "in-progress";

    if (user.learningPath && user.learningPath[stepIndex]) {
      user.learningPath[stepIndex].status = targetStatus;
      if (targetStatus === "completed") {
        user.learningPath[stepIndex].completedAt = new Date();
        user.learningHours = (user.learningHours || 0) + 4;
        user.credits = (user.credits || 100) + 10;
        await user.save();

        try {
          await recalculateUserCompetencyAndGaps(user._id);
        } catch (rErr) {
          console.error("[PATH STEP RECALCULATION ERROR]", rErr);
        }
      } else {
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Course status updated to ${status}.`,
      learningPath: user.learningPath,
      learningHours: user.learningHours,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDiagnosticStatus = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let diagnosticQuiz = await Quiz.findOne({
      assignedTo: userId,
      isDiagnostic: true,
    }).select("_id title topic domain difficulty passingScore questions");

    let diagnosticInterview = await Interview.findOne({
      userId,
      isDiagnostic: true,
    }).select("_id role mode finalScore status createdAt question questions");

    if ((!diagnosticQuiz || !diagnosticInterview) && user.isProfileCompleted) {
      try {
        await generateDiagnosticAssessmentsForUser(user);
        if (!diagnosticQuiz) {
          diagnosticQuiz = await Quiz.findOne({
            assignedTo: userId,
            isDiagnostic: true,
          }).select("_id title topic domain difficulty passingScore questions");
        }
        if (!diagnosticInterview) {
          diagnosticInterview = await Interview.findOne({
            userId,
            isDiagnostic: true,
          }).select("_id role mode finalScore status createdAt question questions");
        }
      } catch (provErr) {
        console.warn("[DIAGNOSTIC STATUS AUTO-PROVISION WARN]", provErr.message);
      }
    }

    let isQuizCompleted = false;
    let quizScore = null;
    if (diagnosticQuiz) {
      const attempt = await QuizAttempt.findOne({
        quizId: diagnosticQuiz._id,
        userId,
      });
      if (attempt) {
        isQuizCompleted = true;
        quizScore = attempt.score;
      }
    }
    if (!isQuizCompleted) {
      const anyAttempt = await QuizAttempt.findOne({ userId });
      if (anyAttempt || (user.quizzesCompleted && user.quizzesCompleted > 0)) {
        isQuizCompleted = true;
        quizScore = anyAttempt?.score || 80;
      }
    }

    let isInterviewCompleted = diagnosticInterview?.status === "completed";
    if (!isInterviewCompleted) {
      const anyInterview = await Interview.findOne({
        userId,
        status: "completed",
      });
      if (anyInterview) {
        isInterviewCompleted = true;
      }
    }

    return res.status(200).json({
      success: true,
      diagnosticQuiz,
      isQuizCompleted,
      quizScore,
      diagnosticInterview,
      isInterviewCompleted,
      isDiagnosticFullyCompleted: isQuizCompleted && isInterviewCompleted,
      isAnyDiagnosticCompleted: isQuizCompleted || isInterviewCompleted,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTargetJobReadinessReport = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.competencies || user.competencies.length === 0) {
      try {
        const recalc = await recalculateUserCompetencyAndGaps(userId);
        if (recalc?.user) user = recalc.user;
      } catch (rErr) {
        console.warn("[JOB READINESS RECALC WARN]", rErr.message);
      }
    }

    const targetRole =
      req.query.targetRole ||
      user.targetCadre ||
      user.jobRole ||
      "Indian Statistical Service (ISS) Officer";

    const benchmark =
      ROLE_BENCHMARK_PROFILES[targetRole] ||
      ROLE_BENCHMARK_PROFILES["Indian Statistical Service (ISS) Officer"] ||
      { minScore: 75, requiredLevels: {} };

    const requiredLevels = benchmark.requiredLevels || {};
    const availableRoles = Object.keys(ROLE_BENCHMARK_PROFILES);

    const [quizAttempts, interviews, assignmentSubmissions] = await Promise.all([
      QuizAttempt.find({ userId }).sort({ createdAt: -1 }),
      Interview.find({ userId, status: "completed" }).sort({ createdAt: -1 }),
      AssignmentSubmission.find({ userId, status: "evaluated" }).sort({ createdAt: -1 }),
    ]);

    const userComps = user.competencies || [];

    const requiredSkillsAudited = [];
    let totalTargetScore = 0;
    let totalCurrentAchieved = 0;

    for (const [skillName, reqLevelStr] of Object.entries(requiredLevels)) {
      const targetScore = levelToScore(reqLevelStr);
      totalTargetScore += targetScore;

      let userComp = userComps.find(
        (c) => c.competencyName.toLowerCase() === skillName.toLowerCase()
      );
      if (!userComp) {
        userComp = userComps.find((c) =>
          checkCompetencyMatch(skillName, c.competencyName)
        );
      }

      let domain = "Statistical Competencies";
      for (const dom of COMPETENCY_DOMAINS) {
        if (
          dom.competencies.some(
            (c) =>
              c.name.toLowerCase() === skillName.toLowerCase() ||
              checkCompetencyMatch(skillName, c.name)
          )
        ) {
          domain = dom.name;
          break;
        }
      }

      const currentScore = userComp ? Math.min(100, Math.max(0, userComp.score || 0)) : 0;
      totalCurrentAchieved += Math.min(targetScore, currentScore);

      const delta = currentScore - targetScore;
      const gap = Math.max(0, targetScore - currentScore);
      const isMet = currentScore >= targetScore;

      requiredSkillsAudited.push({
        skillName,
        domain,
        targetLevel: reqLevelStr,
        targetScore,
        currentScore,
        currentLevel: userComp ? userComp.level || scoreToLevel(currentScore) : "Novice",
        delta,
        gap,
        isMet,
      });
    }

    const totalRequiredSkillsCount = requiredSkillsAudited.length;
    const metSkillsCount = requiredSkillsAudited.filter((s) => s.isMet).length;
    const competencyComplianceRate =
      totalRequiredSkillsCount > 0
        ? Math.round((metSkillsCount / totalRequiredSkillsCount) * 100)
        : 0;

    const competencyScoreWeight =
      totalTargetScore > 0
        ? Math.min(100, Math.round((totalCurrentAchieved / totalTargetScore) * 100))
        : 0;

    const completedQuizzesCount = quizAttempts.length;
    const completedVivasCount = interviews.length;
    const completedAssignmentsCount = assignmentSubmissions.length;
    const quizRigor = Math.min(100, completedQuizzesCount * 25);
    const vivaRigor = completedVivasCount > 0 ? 100 : 0;
    const assignmentRigor = Math.min(100, completedAssignmentsCount * 35);
    const diagnosticRigor =
      completedQuizzesCount > 0 || completedVivasCount > 0 || completedAssignmentsCount > 0 ? 100 : 0;
    const evaluationRigorScore = Math.round(
      quizRigor * 0.30 + vivaRigor * 0.35 + assignmentRigor * 0.20 + diagnosticRigor * 0.15
    );

    const tenureRequirements = {
      "Indian Statistical Service (ISS) Officer": 3,
      "Senior Statistical Officer (SSO)": 2,
      "Junior Statistical Officer (JSO)": 1,
      "Field Operations / Investigator (FOD)": 1,
      "Data Scientist / Statistical Analyst": 2,
      "Director / Division Head (CSO / NSSO)": 5,
    };
    const requiredTenureYears = tenureRequirements[targetRole] || 2;
    const officerTenureYears =
      user.workExperience !== undefined && user.workExperience !== null
        ? user.workExperience
        : user.experienceYears || 0;
    const experienceScore = Math.min(
      100,
      Math.round((officerTenureYears / requiredTenureYears) * 100)
    );

    const completedPathSteps = (user.learningPath || []).filter(
      (s) => s.status === "completed"
    ).length;
    const capacityBuildingScore = Math.min(
      100,
      Math.round(
        completedPathSteps * 20 + Math.min(50, (user.learningHours || 0) * 5)
      )
    );

    const overallReadinessIndex = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          competencyScoreWeight * 0.50 +
            evaluationRigorScore * 0.25 +
            experienceScore * 0.15 +
            capacityBuildingScore * 0.10
        )
      )
    );

    let readinessStatus = "ACTIVE_DEVELOPMENT";
    let readinessTitle = "Under Active Development (Targeted Upskilling)";
    let readinessColor = "amber";
    let formalRecommendation =
      "The officer has acquired foundational knowledge but exhibits operational deficits in statutory competencies. Prioritize iGOT modules and viva drills.";

    if (overallReadinessIndex >= 85) {
      readinessStatus = "DEPLOYMENT_READY";
      readinessTitle = "Fully Cleared for Cadre Deployment";
      readinessColor = "emerald";
      formalRecommendation =
        "The officer exhibits full statutory compliance and benchmark mastery. Recommended for unconditional cadre deployment, promotion, or supervisory statistical leadership.";
    } else if (overallReadinessIndex >= 70) {
      readinessStatus = "CONDITIONALLY_READY";
      readinessTitle = "Conditionally Ready (Minor Practicum Required)";
      readinessColor = "blue";
      formalRecommendation =
        "The officer demonstrates strong operational competence. Conditional deployment cleared pending completion of targeted methodological drills in identified gap areas.";
    } else if (overallReadinessIndex < 50) {
      readinessStatus = "FOUNDATIONAL_STAGE";
      readinessTitle = "Foundational Stage (Mandatory Induction Mandate)";
      readinessColor = "rose";
      formalRecommendation =
        "Assessed competencies currently below target role standards. Immediate enrollment in NSSTA Core Curriculum and diagnostic intake is mandated.";
    }

    const hasDegree = Boolean(
      user.educationalQualification ||
        (Array.isArray(user.education) && user.education.length > 0)
    );
    const prerequisiteChecklist = [
      {
        criterion: "Educational Qualification Baseline",
        requirement: "Master's or Postgraduate Degree in Statistics / Economics / Allied Sciences",
        status: hasDegree ? "PASSED" : "PENDING_VERIFICATION",
        met: hasDegree,
        note: user.educationalQualification || "Declared in Officer Profile",
      },
      {
        criterion: "Tenure in Official Statistical Operations",
        requirement: `Minimum ${requiredTenureYears} Year(s) of Documented Experience`,
        status: officerTenureYears >= requiredTenureYears ? "PASSED" : "DEFICIT",
        met: officerTenureYears >= requiredTenureYears,
        note: `Current: ${officerTenureYears} Year(s) documented`,
      },
      {
        criterion: "Oral Viva Voce Board Evaluation",
        requirement: "Clearance by Cadre Examination Board via AI Viva Simulation",
        status: completedVivasCount > 0 ? "PASSED" : "PENDING_BOARD",
        met: completedVivasCount > 0,
        note: completedVivasCount > 0 ? `${completedVivasCount} Session(s) Completed` : "Oral Board Pending",
      },
      {
        criterion: "Cadre Knowledge Assessments (Quizzes)",
        requirement: "Demonstrated MCQ Proficiency across Statistical Guidelines",
        status: completedQuizzesCount >= 2 ? "PASSED" : "IN_PROGRESS",
        met: completedQuizzesCount >= 2,
        note: `${completedQuizzesCount} Assessment(s) Completed`,
      },
      {
        criterion: "Operational Case Study Practicums",
        requirement: "Demonstrated Practical Problem-Solving in Real-World Statistical Scenarios",
        status: completedAssignmentsCount > 0 ? "PASSED" : "PENDING_PRACTICUM",
        met: completedAssignmentsCount > 0,
        note: completedAssignmentsCount > 0 ? `${completedAssignmentsCount} Practicum(s) Evaluated` : "No Evaluated Practicums",
      },
      {
        criterion: "Cadre Minimum Passing Score Threshold",
        requirement: `Minimum ${benchmark.minScore || 70}% Overall Competency Index`,
        status: (user.overallCompetencyScore || 0) >= (benchmark.minScore || 70) ? "PASSED" : "DEFICIT",
        met: (user.overallCompetencyScore || 0) >= (benchmark.minScore || 70),
        note: `Current: ${user.overallCompetencyScore || 0}% vs ${benchmark.minScore || 70}% Target`,
      },
      {
        criterion: "Statutory Competencies Met",
        requirement: "At least 75% of Role Competencies Meeting Target Benchmark",
        status: competencyComplianceRate >= 75 ? "PASSED" : "DEFICIT",
        met: competencyComplianceRate >= 75,
        note: `${metSkillsCount} of ${totalRequiredSkillsCount} Skills On Target (${competencyComplianceRate}%)`,
      },
    ];

    const domainPillars = COMPETENCY_DOMAINS.map((dom) => {
      const domComps = userComps.filter(
        (c) =>
          (c.domain || "").toLowerCase().includes(dom.id) ||
          dom.competencies.some((sc) => checkCompetencyMatch(sc.name, c.competencyName))
      );
      const avgScore =
        domComps.length > 0
          ? Math.round(
              domComps.reduce((sum, c) => sum + (c.score || 0), 0) / domComps.length
            )
          : 0;

      const reqInDomain = requiredSkillsAudited.filter(
        (s) =>
          s.domain.toLowerCase().includes(dom.id) ||
          (dom.id === "technical" && s.domain.toLowerCase().includes("technical")) ||
          (dom.id === "digital_governance" && s.domain.toLowerCase().includes("governance")) ||
          (dom.id === "managerial" && s.domain.toLowerCase().includes("managerial"))
      );
      const targetDomScore =
        reqInDomain.length > 0
          ? Math.round(
              reqInDomain.reduce((sum, s) => sum + s.targetScore, 0) /
                reqInDomain.length
            )
          : benchmark.minScore || 70;

      return {
        id: dom.id,
        title: dom.name,
        currentScore: avgScore,
        targetScore: targetDomScore,
        complianceRate: Math.min(
          100,
          Math.round((avgScore / (targetDomScore || 1)) * 100)
        ),
      };
    });

    const keyStrengths = requiredSkillsAudited
      .filter((s) => s.isMet && s.currentScore >= 75)
      .slice(0, 4);

    const keyBlockers = requiredSkillsAudited
      .filter((s) => !s.isMet)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 4);

    const milestones = [];
    if (completedVivasCount === 0) {
      milestones.push({
        step: milestones.length + 1,
        title: "Complete Cadre Board Oral Viva Voce",
        type: "viva",
        link: "/interview",
        impact: "+15% Readiness Index",
      });
    }
    if (keyBlockers.length > 0) {
      milestones.push({
        step: milestones.length + 1,
        title: `Remediate Primary Gap: ${keyBlockers[0].skillName}`,
        type: "quiz",
        link: "/skill-gaps",
        impact: `Close ${keyBlockers[0].gap} pts Deficit`,
      });
    }
    if (completedQuizzesCount < 3) {
      milestones.push({
        step: milestones.length + 1,
        title: "Complete 2 Additional MCQ Practicum Assessments",
        type: "assessment",
        link: "/quizzes",
        impact: "+10% Evaluation Rigor",
      });
    }
    if (completedAssignmentsCount === 0) {
      milestones.push({
        step: milestones.length + 1,
        title: "Submit Operational Case Study Practicum",
        type: "assignment",
        link: "/assignments",
        impact: "+15% Operational Competence",
      });
    }
    if (completedPathSteps === 0) {
      milestones.push({
        step: milestones.length + 1,
        title: "Initiate iGOT Karmayogi / NSSTA Capacity Building Course",
        type: "course",
        link: "/learning-path",
        impact: "+10% Capacity Building",
      });
    }

    return res.status(200).json({
      success: true,
      officer: {
        _id: user._id,
        name: user.name,
        designation: user.designation,
        department: user.department,
        jobRole: user.jobRole,
        targetCadre: user.targetCadre,
        educationalQualification: user.educationalQualification,
        workExperience: officerTenureYears,
        overallCompetencyScore: user.overallCompetencyScore || 0,
        overallLevel: user.overallLevel || "Novice",
        learningStreak: user.learningStreak || 0,
        learningHours: user.learningHours || 0,
      },
      targetRole,
      availableRoles,
      readinessIndex: overallReadinessIndex,
      readinessStatus,
      readinessTitle,
      readinessColor,
      formalRecommendation,
      scoresBreakdown: {
        competencyScoreWeight,
        evaluationRigorScore,
        experienceScore,
        capacityBuildingScore,
        targetMinScore: benchmark.minScore || 70,
        currentOverallScore: user.overallCompetencyScore || 0,
        completedQuizzesCount,
        completedVivasCount,
        completedAssignmentsCount,
      },
      prerequisiteChecklist,
      domainPillars,
      keyStrengths,
      keyBlockers,
      requiredSkillsAudited,
      milestones,
    });
  } catch (error) {
    console.error("[TARGET JOB READINESS REPORT ERROR]", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

