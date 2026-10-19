import User from "../models/userModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import Interview from "../models/interviewModel.js";
import { AssignmentSubmission } from "../models/assignmentModel.js";
import {
  COMPETENCY_DOMAINS,
  ROLE_BENCHMARK_PROFILES,
} from "../config/competencyFramework.js";
import { getIgotCourses } from "./igotService.js";
import { getTpacProgrammes } from "./tpacService.js";

export const scoreToLevel = (score) => {
  if (score >= 85) return "Expert";
  if (score >= 70) return "Advanced";
  if (score >= 55) return "Intermediate";
  if (score >= 40) return "Beginner";
  return "Novice";
};

export const levelToScore = (level) => {
  switch (String(level).toLowerCase()) {
    case "expert":
      return 88;
    case "advanced":
      return 75;
    case "intermediate":
      return 60;
    case "beginner":
      return 45;
    default:
      return 35;
  }
};

export const recalculateUserCompetencyAndGaps = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const [quizAttempts, completedInterviews, assignmentSubmissions] =
      await Promise.all([
        QuizAttempt.find({ userId }).sort({ createdAt: -1 }),
        Interview.find({ userId, status: "completed" }).sort({ createdAt: -1 }),
        AssignmentSubmission.find({ userId, status: "evaluated" }).sort({
          createdAt: -1,
        }),
      ]);

    const totalAssessmentsCount =
      quizAttempts.length +
      completedInterviews.length +
      assignmentSubmissions.length;

    const completedPathSteps = (user.learningPath || []).filter(
      (s) => s.status === "completed",
    );

    if (totalAssessmentsCount === 0 && completedPathSteps.length === 0) {
      return {
        user,
        updated: false,
        reason: "No assessment attempts or course completions yet",
      };
    }

    const roleKey =
      user.jobRole ||
      user.targetCadre ||
      "Indian Statistical Service (ISS) Officer";
    const benchmark = ROLE_BENCHMARK_PROFILES[roleKey] ||
      ROLE_BENCHMARK_PROFILES["Indian Statistical Service (ISS) Officer"] || {
        minScore: 70,
        requiredLevels: {},
      };

    const domainScoresMap = {
      statistical: [],
      technical: [],
      digital_governance: [],
      managerial: [],
    };

    const updatedCompetencies = [];

    const matchesCompetency = (targetName, testString) => {
      if (!targetName || !testString) return false;
      const t1 = targetName.toLowerCase();
      const t2 = testString.toLowerCase();

      if (t1.includes(t2) || t2.includes(t1)) return true;

      const tokens1 = t1.split(/[\s,&/()\-]+/).filter((w) => w.length > 3);
      const tokens2 = t2.split(/[\s,&/()\-]+/).filter((w) => w.length > 3);
      return tokens1.some((tok) => tokens2.includes(tok));
    };

    for (const domain of COMPETENCY_DOMAINS) {
      const domainKey = domain.id;

      for (const comp of domain.competencies) {
        const compName = comp.name;
        const matchedScores = [];

        for (const attempt of quizAttempts) {
          const attemptTopic = `${attempt.quizTitle || ""} ${attempt.topic || ""} ${attempt.domain || ""}`;
          if (matchesCompetency(compName, attemptTopic)) {
            let sc =
              attempt.score !== undefined && attempt.score !== null
                ? attempt.score
                : attempt.percentage;
            if (sc === undefined || sc === null) {
              sc = attempt.totalQuestions
                ? Math.round(
                    ((attempt.correctCount || 0) / attempt.totalQuestions) *
                      100,
                  )
                : 60;
            } else if (
              sc <= 10 &&
              attempt.totalQuestions &&
              attempt.totalQuestions <= 10
            ) {
              sc = Math.round((sc / attempt.totalQuestions) * 100);
            }
            matchedScores.push(Math.min(100, Math.max(0, Number(sc) || 0)));
          }
        }

        for (const sub of assignmentSubmissions) {
          const subTitle = `${sub.assignmentTitle || ""} ${sub.targetCompetency || ""}`;
          if (matchesCompetency(compName, subTitle)) {
            const sc =
              sub.aiEvaluation?.overallScore !== undefined &&
              sub.aiEvaluation?.overallScore !== null
                ? sub.aiEvaluation.overallScore
                : sub.score !== undefined
                  ? sub.scoreMax === 10
                    ? sub.score * 10
                    : sub.score
                  : 70;
            matchedScores.push(Math.min(100, Math.max(0, Number(sc) || 0)));
          }
        }

        for (const viva of completedInterviews) {
          if (domainKey === "managerial" || domainKey === "statistical") {
            const raw =
              Number(viva.finalScore) ||
              Number(viva.score) ||
              (viva.feedback?.rating ? viva.feedback.rating * 10 : null);
            const scaled = raw !== null ? (raw <= 10 ? raw * 10 : raw) : 70;
            matchedScores.push(Math.min(100, Math.max(0, Math.round(scaled))));
          }
        }

        const hasCompletedStep = completedPathSteps.some((step) =>
          matchesCompetency(compName, `${step.title} ${step.skillAddressed}`),
        );

        let compScore = 0;
        if (matchedScores.length > 0) {
          const recentWeight = 0.7;
          const avgScore =
            matchedScores.reduce((sum, val) => sum + val, 0) /
            matchedScores.length;
          const latestScore = matchedScores[0];
          compScore = Math.round(
            latestScore * recentWeight + avgScore * (1 - recentWeight),
          );

          if (hasCompletedStep) {
            compScore = Math.min(100, compScore + 12);
          }
        } else if (hasCompletedStep) {
          compScore = 65;
        } else {
          if (totalAssessmentsCount > 0) {
            const allQuizAvg =
              quizAttempts.length > 0
                ? quizAttempts.reduce((acc, q) => acc + (q.score || 0), 0) /
                  quizAttempts.length
                : 50;
            compScore = Math.max(25, Math.round(allQuizAvg * 0.5));
          } else {
            compScore = 0;
          }
        }

        const compLevel = scoreToLevel(compScore);

        updatedCompetencies.push({
          domain: domain.name,
          competencyName: compName,
          level: compLevel,
          score: compScore,
          source:
            matchedScores.length > 0 ? "assessment-derived" : "ai-inferred",
          rationale:
            matchedScores.length > 0
              ? `Derived from ${matchedScores.length} official evaluation(s).`
              : "Baseline estimate awaiting direct assessment topic evaluation.",
          lastAssessedAt: new Date(),
        });

        domainScoresMap[domainKey].push(compScore);
      }
    }

    const domainAverages = {
      statistical: Math.round(
        domainScoresMap.statistical.reduce((a, b) => a + b, 0) /
          (domainScoresMap.statistical.length || 1),
      ),
      technical: Math.round(
        domainScoresMap.technical.reduce((a, b) => a + b, 0) /
          (domainScoresMap.technical.length || 1),
      ),
      digital_governance: Math.round(
        domainScoresMap.digital_governance.reduce((a, b) => a + b, 0) /
          (domainScoresMap.digital_governance.length || 1),
      ),
      managerial: Math.round(
        domainScoresMap.managerial.reduce((a, b) => a + b, 0) /
          (domainScoresMap.managerial.length || 1),
      ),
    };

    const overallScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          domainAverages.statistical * 0.35 +
            domainAverages.technical * 0.25 +
            domainAverages.digital_governance * 0.2 +
            domainAverages.managerial * 0.2,
        ),
      ),
    );

    const overallLevel = scoreToLevel(overallScore);

    const dynamicSkillGaps = [];
    const requiredLevels = benchmark.requiredLevels || {};

    for (const comp of updatedCompetencies) {
      let requiredLevelStr = requiredLevels[comp.competencyName];
      if (!requiredLevelStr) {
        const foundKey = Object.keys(requiredLevels).find((k) =>
          matchesCompetency(comp.competencyName, k),
        );
        requiredLevelStr = foundKey ? requiredLevels[foundKey] : "Intermediate";
      }

      const benchmarkTargetScore = levelToScore(requiredLevelStr);
      const gapScore = Math.max(0, benchmarkTargetScore - comp.score);

      let priority = "Low";
      let impact = "Capability meets standard requirements.";
      let recommendedAction =
        "Maintain proficiency with periodic refresher drills.";

      if (gapScore >= 25 || comp.score < 45) {
        priority = "High";
        impact =
          "Critical capability gap directly impacting official statistical reporting.";
        recommendedAction = `Prioritize NSSTA & iGOT core curriculum for ${comp.competencyName}.`;
      } else if (gapScore >= 10 || comp.score < 65) {
        priority = "Medium";
        impact =
          "Moderate operational gap requiring targeted practicum drills.";
        recommendedAction = `Complete practical assignment and exercises in ${comp.competencyName}.`;
      }

      if (gapScore > 0 || priority === "High" || priority === "Medium") {
        dynamicSkillGaps.push({
          competencyName: comp.competencyName,
          domain: comp.domain,
          currentLevel: comp.level,
          requiredLevel: requiredLevelStr,
          gapScore,
          priority,
          impact,
          recommendedAction,
        });
      }
    }

    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    dynamicSkillGaps.sort(
      (a, b) =>
        (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0) ||
        b.gapScore - a.gapScore,
    );

    let existingPath = Array.isArray(user.learningPath)
      ? user.learningPath
      : [];
    if (existingPath.length === 0 && dynamicSkillGaps.length > 0) {
      const igotCourses = await getIgotCourses();
      const tpacProgrammes = getTpacProgrammes();

      const topGaps = dynamicSkillGaps.slice(0, 5);
      existingPath = topGaps.map((gap, idx) => {
        const matchingIgot = igotCourses.find((c) =>
          matchesCompetency(
            gap.competencyName,
            `${c.title} ${c.skillAddressed}`,
          ),
        );
        const matchingTpac = tpacProgrammes.find((p) =>
          matchesCompetency(
            gap.competencyName,
            `${p.title} ${p.competencyAddressed}`,
          ),
        );

        const provider = matchingTpac ? "NSSTA TPAC" : "iGOT Karmayogi";
        const title = matchingTpac
          ? matchingTpac.title
          : matchingIgot
            ? matchingIgot.title
            : `Specialized Course on ${gap.competencyName}`;

        return {
          step: idx + 1,
          title,
          provider,
          skillAddressed: gap.competencyName,
          duration: matchingTpac
            ? `${matchingTpac.durationWeeks} Weeks`
            : "12 Hours",
          currentLevel: gap.currentLevel,
          targetLevel: gap.requiredLevel,
          priority: gap.priority,
          rationale: gap.recommendedAction,
          status: idx === 0 ? "in-progress" : "not-started",
          externalUrl: "",
        };
      });
    }

    user.competencies = updatedCompetencies;
    user.skillGaps = dynamicSkillGaps;
    user.overallCompetencyScore = overallScore;
    user.overallLevel = overallLevel;
    if (existingPath.length > 0) {
      user.learningPath = existingPath;
    }

    await user.save();

    return {
      user,
      overallScore,
      overallLevel,
      domainAverages,
      skillGapsCount: dynamicSkillGaps.length,
      competenciesCount: updatedCompetencies.length,
      assessmentCount: totalAssessmentsCount,
    };
  } catch (error) {
    console.error("[RECALCULATE USER COMPETENCY ERROR]", error);
    throw error;
  }
};
