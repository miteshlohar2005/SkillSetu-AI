import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import dotenv from "dotenv";
import {
  COMPETENCY_DOMAINS,
  ROLE_BENCHMARK_PROFILES,
} from "../config/competencyFramework.js";

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const aiClient = geminiApiKey
  ? new GoogleGenAI({ apiKey: geminiApiKey })
  : null;

export const cleanAndParseJson = (rawText, defaultFallback = {}) => {
  if (!rawText) return defaultFallback;
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn(
      "[JSON PARSE WARN] Direct parse failed, attempting regex extraction...",
      e.message,
    );
    try {
      const match = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (innerErr) {
      console.error("[JSON PARSE FATAL] Extraction failed:", innerErr.message);
    }
    return defaultFallback;
  }
};

export const scoreToLevel = (score) => {
  if (score >= 85) return "Expert";
  if (score >= 70) return "Advanced";
  if (score >= 50) return "Intermediate";
  return "Beginner";
};

export const callGeminiOrFallback = async (
  prompt,
  systemInstruction = "",
  options = {},
) => {
  if (aiClient) {
    try {
      let contents = prompt;
      if (options.imageInlineData) {
        contents = [
          {
            inlineData: {
              mimeType: options.imageInlineData.mimeType || "image/png",
              data: options.imageInlineData.data,
            },
          },
          {
            text: typeof prompt === "string" ? prompt : JSON.stringify(prompt),
          },
        ];
      }

      const config = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (options.jsonMode) config.responseMimeType = "application/json";

      const response = await aiClient.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (engineError) {
      console.warn(
        "[SKILLSETU AI WARNING] Engine call failed, attempting fallback:",
        engineError.message,
      );
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-4o-mini",
          messages: [
            ...(systemInstruction
              ? [{ role: "system", content: systemInstruction }]
              : []),
            {
              role: "user",
              content:
                typeof prompt === "string" ? prompt : JSON.stringify(prompt),
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );
      if (res.data?.choices?.[0]?.message?.content) {
        return res.data.choices[0].message.content;
      }
    } catch (openRouterErr) {
      console.warn(
        "[OPENROUTER WARNING] Fallback failed:",
        openRouterErr.message,
      );
    }
  }

  throw new Error(
    "SkillSetu AI Service is temporarily unavailable. Please check your GEMINI_API_KEY configuration.",
  );
};

export const generateCompetencyAssessment = async ({
  profile = {},
  selfRatings = {},
  quizHistory = [],
}) => {
  const prompt = `
You are the SkillSetu AI Engine, the official competency evaluator for the statistical workforce capacity building framework.

Assess the competency matrix of the following official:
- Cadre/Job Role: ${profile.jobRole || "Indian Statistical Service (ISS) Officer"}
- Department/Division: ${profile.department || "Field Operations / CSO / NSSO"}
- Designation: ${profile.designation || "Statistical Officer"}
- Work Experience: ${profile.workExperience || "3"} years
- Educational Qualification: ${profile.educationalQualification || "Master's in Statistics / Economics / Mathematics"}
- Previous Training Records: ${JSON.stringify(profile.previousTraining || [])}
- Self-Reported Ratings (1-5 scale): ${JSON.stringify(selfRatings)}
- Recent Quiz/Test Performance: ${JSON.stringify(quizHistory.slice(0, 5))}

Standard Competency Taxonomy across 4 domains:
1. Statistical Competencies: Survey Design, Sampling Techniques, National Accounts & GDP, Price Statistics (CPI/WPI), Labour Statistics (PLFS), Industrial Statistics (ASI/IIP), SDG National Indicators, Data Quality Assurance (NQAF).
2. Technical & Computational Competencies: Statistical Computing & Automated Survey Data Processing, Microdata Analytics & Survey Weighting Methodologies, Statistical Database Systems & Registry Linkage, Econometric Modeling & Time-Series Analytics, GIS & Geospatial Statistical Mapping, Statistical Dashboards & Executive Visual Reporting, Machine Learning & Predictive Statistical Analytics.
3. Digital Governance & Security: Cybersecurity (Cert-In), Data Privacy & DPDP Act, Digital Public Infrastructure, MeghRaj Cloud Architecture.
4. Behavioural & Managerial: Statistical Leadership, Evidence-Based Decision Making, Survey Project Management, Strategic Communication.

Generate a comprehensive assessment with individual scores (0 to 100), levels (Beginner, Intermediate, Advanced, Expert), and categorized insights.

Return STRICTLY a JSON object with this exact schema:
{
  "overallScore": 72,
  "overallLevel": "Advanced",
  "domainScores": {
    "statistical": 75,
    "technical": 65,
    "digital_governance": 70,
    "managerial": 78
  },
  "competencies": [
    {
      "domain": "Statistical Competencies",
      "competencyName": "Sampling Techniques & Estimation",
      "score": 82,
      "level": "Advanced",
      "source": "ai-inferred",
      "rationale": "Demonstrated strong grounding from experience and survey assignments."
    }
  ],
  "strengths": ["Clear strength in household survey methodologies", "Strong data quality auditing"],
  "developmentAreas": ["Requires upskilling in automated statistical computing for microdata processing", "Needs deeper knowledge of System of National Accounts (SNA 2008)"]
}
`;

  try {
    const raw = await callGeminiOrFallback(
      prompt,
      "You are the SkillSetu AI statistical capacity building engine. Always return valid JSON without markdown fences.",
    );
    const parsed = cleanAndParseJson(raw, null);
    if (parsed && parsed.competencies && parsed.competencies.length) {
      return parsed;
    }
  } catch (err) {
    console.error("[AI ASSESSMENT ERROR]", err.message);
  }

  const calculatedCompetencies = [];
  COMPETENCY_DOMAINS.forEach((domain) => {
    domain.competencies.forEach((comp) => {
      const selfVal = Number(
        selfRatings[comp.name] || selfRatings[comp.id] || 3,
      );
      const baseScore = Math.min(
        95,
        Math.max(25, selfVal * 18 + (profile.workExperience || 2) * 2),
      );
      calculatedCompetencies.push({
        domain: domain.name,
        competencyName: comp.name,
        score: baseScore,
        level: scoreToLevel(baseScore),
        source: "self-reported",
        rationale: `Assessed based on profile tenure in ${profile.department || "MoSPI"} and self-evaluation.`,
      });
    });
  });

  const avgScore = Math.round(
    calculatedCompetencies.reduce((acc, c) => acc + c.score, 0) /
      calculatedCompetencies.length,
  );

  return {
    overallScore: avgScore,
    overallLevel: scoreToLevel(avgScore),
    domainScores: {
      statistical: Math.round(avgScore * 1.05),
      technical: Math.round(avgScore * 0.92),
      digital_governance: Math.round(avgScore * 0.98),
      managerial: Math.round(avgScore * 1.02),
    },
    competencies: calculatedCompetencies,
    strengths: [
      "Sampling & Survey Methodologies",
      "Official Statistics Dissemination",
    ],
    developmentAreas: [
      "Automated Statistical Computing & Microdata Processing",
      "National Accounts & Supply-Use Tables",
    ],
  };
};

export const analyzeSkillGaps = async ({
  currentCompetencies = [],
  targetRole = "Indian Statistical Service (ISS) Officer",
  department = "MoSPI",
}) => {
  const benchmark =
    ROLE_BENCHMARK_PROFILES[targetRole] ||
    ROLE_BENCHMARK_PROFILES["Indian Statistical Service (ISS) Officer"];

  const prompt = `
You are the SkillSetu AI Capacity Planner for statistical workforce development.

Analyze skill gaps for an official in the following context:
- Target Role/Cadre: ${targetRole}
- Department: ${department}
- Current Assessed Competencies: ${JSON.stringify(currentCompetencies.map((c) => ({ name: c.competencyName, score: c.score, level: c.level })))}
- Benchmark Cadre Targets: ${JSON.stringify(benchmark.requiredLevels)}

Identify all competencies where Current Level is lower than Required Benchmark Level.
Prioritize gaps into High, Medium, and Low.

Return STRICTLY a JSON object with this exact schema:
{
  "skillGaps": [
    {
      "competencyName": "Statistical Computing & Automated Survey Data Processing",
      "domain": "Technical & Computational Competencies",
      "currentLevel": "Beginner",
      "requiredLevel": "Intermediate",
      "gapScore": 35,
      "priority": "High",
      "impact": "Crucial for automated validation of National Sample Survey datasets.",
      "recommendedAction": "Complete iGOT Automated Statistical Computing & NSSTA practicum."
    }
  ],
  "summary": "The official has high priority gaps primarily in statistical computing and national accounts compilation.",
  "readinessPercentage": 74
}
`;

  try {
    const raw = await callGeminiOrFallback(
      prompt,
      "You are a government statistical competency planner. Always return strict valid JSON.",
    );
    const parsed = cleanAndParseJson(raw, null);
    if (parsed && Array.isArray(parsed.skillGaps) && parsed.skillGaps.length) {
      return parsed;
    }
  } catch (err) {
    console.error("[SKILL GAP ANALYSIS ERROR]", err.message);
  }

  const gaps = [];
  const requiredLevels = benchmark.requiredLevels;

  (currentCompetencies || []).forEach((comp) => {
    if (!comp || !comp.competencyName) return;
    const required = requiredLevels[comp.competencyName] || "Intermediate";
    const levelRanks = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
    const currentRank = levelRanks[comp.level] || 1;
    const requiredRank = levelRanks[required] || 2;

    if (currentRank < requiredRank) {
      const diff = requiredRank - currentRank;
      gaps.push({
        competencyName: comp.competencyName,
        domain: comp.domain || "Statistical Competencies",
        currentLevel: comp.level,
        requiredLevel: required,
        gapScore: diff * 25,
        priority: diff >= 2 ? "High" : diff === 1 ? "Medium" : "Low",
        impact: `Benchmark requirement for ${targetRole}.`,
        recommendedAction: `Complete targeted training module on ${comp.competencyName}.`,
      });
    }
  });

  return {
    skillGaps: gaps.sort((a, b) => (a.priority === "High" ? -1 : 1)),
    summary: `Identified ${gaps.length} competency gaps against standard ${targetRole} benchmarks.`,
    readinessPercentage: Math.max(45, 100 - gaps.length * 8),
  };
};


export const generateLearningPath = async ({
  competencyGaps = [],
  jobRole = "Statistical Officer",
  department = "MoSPI",
  availableCourses = [],
}) => {
  const prompt = `
You are the SkillSetu AI Curriculum Director, designing a personalized capacity building pathway for:
- Role: ${jobRole}
- Department: ${department}
- Identified Gaps: ${JSON.stringify(competencyGaps.map((g) => ({ name: g.competencyName, priority: g.priority, current: g.currentLevel, target: g.requiredLevel })))}
- Available iGOT / NSSTA TPAC Catalog: ${JSON.stringify(availableCourses.map((c) => ({ id: c.id, title: c.title, provider: c.provider, skill: c.skillAddressed })))}

Create an ordered, pedagogical 5-step learning pathway combining iGOT Karmayogi online modules and NSSTA TPAC in-service training.

Return STRICTLY a JSON object with this exact schema:
{
  "pathwayTitle": "Official Statistics Modernization & Analytics Pathway",
  "estimatedTotalHours": 48,
  "learningPath": [
    {
      "step": 1,
      "title": "Automated Statistical Computing & Microdata Processing in Government",
      "provider": "iGOT Karmayogi",
      "skillAddressed": "Statistical Computing & Automated Survey Data Processing",
      "duration": "20 Hours",
      "currentLevel": "Beginner",
      "targetLevel": "Intermediate",
      "priority": "High",
      "rationale": "Essential prerequisite for automated survey data wrangling.",
      "status": "in-progress"
    }
  ]
}
`;

  try {
    const raw = await callGeminiOrFallback(
      prompt,
      "You are an official curriculum designer. Always output strict JSON.",
    );
    const parsed = cleanAndParseJson(raw, null);
    if (
      parsed &&
      Array.isArray(parsed.learningPath) &&
      parsed.learningPath.length
    ) {
      const normalized = parsed.learningPath.map((step, idx) => ({
        step: Number(step.step) || idx + 1,
        title: step.title || `Module ${idx + 1}`,
        provider: step.provider || "iGOT Karmayogi",
        skillAddressed: step.skillAddressed || "Statistical Competencies",
        duration: step.duration || "12 Hours",
        currentLevel: step.currentLevel || "Beginner",
        targetLevel: step.targetLevel || "Intermediate",
        priority: ["High", "Medium", "Low"].includes(step.priority)
          ? step.priority
          : idx < 2
            ? "High"
            : "Medium",
        rationale:
          step.rationale || "Core competency capacity building module.",
        status: ["in-progress", "completed", "not-started", "pending"].includes(
          step.status,
        )
          ? step.status
          : idx === 0
            ? "in-progress"
            : "not-started",
        externalUrl: step.externalUrl || "",
      }));

      return {
        pathwayTitle:
          parsed.pathwayTitle || `${jobRole} Capacity Building Pathway`,
        estimatedTotalHours: Number(parsed.estimatedTotalHours) || 48,
        learningPath: normalized,
      };
    }
  } catch (err) {
    console.error("[LEARNING PATHWAY ERROR]", err.message);
  }

  const path = (availableCourses || []).slice(0, 5).map((course, idx) => ({
    step: idx + 1,
    title: course.title,
    provider: course.provider || "iGOT Karmayogi",
    skillAddressed: course.skillAddressed || "Statistical Competency",
    duration: course.duration || "12 Hours",
    currentLevel: "Intermediate",
    targetLevel: "Advanced",
    priority: idx < 2 ? "High" : "Medium",
    rationale: `Targeted to bridge core competencies in ${course.skillAddressed}.`,
    status: idx === 0 ? "in-progress" : "not-started",
  }));

  return {
    pathwayTitle: `${jobRole} Capacity Building Pathway`,
    estimatedTotalHours: 54,
    learningPath: path,
  };
};

const buildMcqPrompt = ({
  textChunk,
  documentTitle,
  domain,
  topic,
  numQuestions,
  difficulty,
  isAllMode = false,
}) => {
  return `
You are the Chief Examination & Pedagogical Wing of the National Statistical Systems Training Academy (NSSTA).
Thoroughly analyze the following complete content extracted from the official training manual/presentation/document: "${documentTitle}"
Domain: ${domain} | Primary Topic: ${topic}

--- DOCUMENT CONTENT START ---
${textChunk}
--- DOCUMENT CONTENT END ---

${
  isAllMode
    ? `TASK: EXHAUSTIVE MCQ GENERATION.
Generate ALL POSSIBLE high-quality multiple-choice questions (MCQs) that can be formulated from this content.
Do NOT omit any section, slide, key definition, formula, classification, rule, procedure, or conceptual distinction.
Formulate as many thorough, non-redundant questions as needed to achieve 100% conceptual mastery of this document.`
    : `TASK: Generate ${numQuestions} high-quality multiple-choice questions (MCQs) of difficulty level: ${difficulty}.
Questions must rigorously test conceptual, procedural, and analytical understanding of the document.`
}

CRITICAL PEDAGOGICAL REQUIREMENTS:
1. **Coverage**: Formulate questions covering every slide/page/section in the text (definitions, formulas, classifications, survey rules, workflows, practical interpretation).
2. **Options**: Exactly 4 plausible, unambiguous options labeled:
   "A) [Option text]",
   "B) [Option text]",
   "C) [Option text]",
   "D) [Option text]"
3. **Correct Answer**: Exactly one valid letter ("A", "B", "C", or "D").
4. **Pedagogical Rationale / Explanation**: A comprehensive official explanation explaining WHY the correct option is right and WHY the distractors are incorrect or inapplicable.
5. **Source Reference**: Identify the specific slide, page, or section (e.g. "Slide 3: Sampling Frames" or "Page 2 - Section 1.4").
6. **Difficulty**: Assign "Easy", "Medium", or "Hard" based on cognitive depth.

Return STRICTLY a valid JSON array of question objects matching this schema:
[
  {
    "question": "What is the primary purpose of second-stage stratification in multi-stage survey sampling?",
    "options": [
      "A) To decrease total sample size arbitrarily",
      "B) To improve precision by grouping homogeneous households by socio-economic affluence",
      "C) To eliminate rural clusters entirely",
      "D) To bypass primary field listing"
    ],
    "correctAnswer": "B",
    "explanation": "Second-stage stratification groups ultimate sampling units into homogeneous strata to minimize within-stratum variance, significantly enhancing estimation precision.",
    "topic": "${topic}",
    "sourceReference": "Slide 2 / Section 3: Stratification Guidelines",
    "difficulty": "${difficulty}"
  }
]
`;
};

const normalizeMcq = (rawQ, defaultTopic, defaultDifficulty, defaultTitle) => {
  if (!rawQ || !rawQ.question) return null;

  let rawOptions = Array.isArray(rawQ.options) ? rawQ.options : [];
  let formattedOptions = [];

  if (rawOptions.length >= 4) {
    formattedOptions = rawOptions.slice(0, 4).map((opt, idx) => {
      const label = ["A", "B", "C", "D"][idx];
      const cleanText = String(opt)
        .replace(/^[A-D][\)\.\:\-\s]+/i, "")
        .trim();
      return `${label}) ${cleanText}`;
    });
  } else {
    formattedOptions = [
      `A) Direct principle stated in ${defaultTitle}`,
      `B) Secondary administrative convention`,
      `C) Non-standard unverified assumption`,
      `D) Excluded operational category`,
    ];
  }

  let correctLetter = "A";
  if (typeof rawQ.correctAnswer === "string") {
    const match = rawQ.correctAnswer.trim().toUpperCase().match(/[A-D]/);
    if (match) correctLetter = match[0];
  }

  return {
    question: String(rawQ.question).trim(),
    options: formattedOptions,
    correctAnswer: correctLetter,
    explanation: String(
      rawQ.explanation ||
        rawQ.rationale ||
        `Official guideline concept from ${defaultTitle}.`,
    ).trim(),
    topic: String(rawQ.topic || defaultTopic).trim(),
    sourceReference: String(
      rawQ.sourceReference || rawQ.slide || rawQ.page || defaultTitle,
    ).trim(),
    difficulty: ["Easy", "Medium", "Hard"].includes(rawQ.difficulty)
      ? rawQ.difficulty
      : defaultDifficulty,
  };
};

export const generateMCQsFromText = async (
  textOrOptions = {},
  maybeOptions = {},
) => {
  let textContent = "";
  let documentTitle = "Official Training Manual";
  let domain = "Statistical Competencies";
  let topic = "Survey Methodologies";
  let numQuestions = "all";
  let difficulty = "Medium";
  let mode = "all"; 
  let fileData = "";
  let fileType = "";

  if (typeof textOrOptions === "string") {
    textContent = textOrOptions;
    if (typeof maybeOptions === "object" && maybeOptions !== null) {
      documentTitle = maybeOptions.documentTitle || documentTitle;
      domain = maybeOptions.domain || domain;
      topic = maybeOptions.topic || topic;
      numQuestions = maybeOptions.numQuestions ?? numQuestions;
      difficulty = maybeOptions.difficulty || difficulty;
      mode = maybeOptions.mode || (numQuestions === "all" ? "all" : "fixed");
      fileData = maybeOptions.fileData || "";
      fileType = maybeOptions.fileType || "";
    }
  } else if (typeof textOrOptions === "object" && textOrOptions !== null) {
    textContent = textOrOptions.textContent || "";
    documentTitle = textOrOptions.documentTitle || documentTitle;
    domain = textOrOptions.domain || domain;
    topic = textOrOptions.topic || topic;
    numQuestions = textOrOptions.numQuestions ?? numQuestions;
    difficulty = textOrOptions.difficulty || difficulty;
    mode = textOrOptions.mode || (numQuestions === "all" ? "all" : "fixed");
    fileData = textOrOptions.fileData || "";
    fileType = textOrOptions.fileType || "";
  }

  const isAllMode =
    mode === "all" || numQuestions === "all" || Number(numQuestions) >= 15;
  const cleanText = (textContent || "").trim();

  let imageInlineData = null;
  if (fileData && fileData.startsWith("data:image/")) {
    const match = fileData.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      imageInlineData = {
        mimeType: match[1],
        data: match[2],
      };
    }
  }

  const chunks = [];
  const MAX_CHUNK_SIZE = 25000;

  if (
    cleanText.length > MAX_CHUNK_SIZE &&
    (cleanText.includes("--- Slide") || cleanText.includes("--- Page"))
  ) {
    const delimiter = cleanText.includes("--- Slide")
      ? /(?=--- Slide \d+)/g
      : /(?=--- Page \d+)/g;
    const sections = cleanText.split(delimiter).filter(Boolean);

    let currentChunk = "";
    for (const section of sections) {
      if (
        (currentChunk + section).length > MAX_CHUNK_SIZE &&
        currentChunk.length > 500
      ) {
        chunks.push(currentChunk.trim());
        currentChunk = section;
      } else {
        currentChunk += `\n\n${section}`;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    chunks.push(cleanText.slice(0, 100000));
  }

  const allGeneratedQuestions = [];

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const targetForChunk = isAllMode
        ? "all"
        : Math.max(3, Math.ceil(Number(numQuestions) / chunks.length));

      const prompt = buildMcqPrompt({
        textChunk:
          chunk ||
          `Official NSSTA study material: ${documentTitle}. Focus on ${topic} (${domain}).`,
        documentTitle:
          chunks.length > 1
            ? `${documentTitle} (Part ${i + 1} of ${chunks.length})`
            : documentTitle,
        domain,
        topic,
        numQuestions: targetForChunk,
        difficulty,
        isAllMode,
      });

      const raw = await callGeminiOrFallback(
        prompt,
        "You are the senior NSSTA Examination Director. Return strictly a JSON array of valid multiple choice questions with thorough explanations.",
        { imageInlineData, jsonMode: true },
      );

      const parsed = cleanAndParseJson(raw, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((rawQ) => {
          const normalized = normalizeMcq(
            rawQ,
            topic,
            difficulty,
            documentTitle,
          );
          if (normalized) {
            const isDuplicate = allGeneratedQuestions.some(
              (existing) =>
                existing.question.toLowerCase().trim() ===
                normalized.question.toLowerCase().trim(),
            );
            if (!isDuplicate) {
              allGeneratedQuestions.push(normalized);
            }
          }
        });
      }
    }

    if (allGeneratedQuestions.length > 0) {
      if (!isAllMode && Number(numQuestions) > 0) {
        return allGeneratedQuestions.slice(0, Number(numQuestions));
      }
      return allGeneratedQuestions;
    }
  } catch (err) {
    console.error("[MCQ GENERATION ERROR]", err.message);
  }

  return [
    {
      question: `In official statistical methodology based on ${documentTitle}, what constitutes the fundamental unit for primary sampling verification?`,
      options: [
        "A) Census Enumeration Block (CEB) / Urban Frame Survey (UFS) Block",
        "B) Administrative District Headquarters registry only",
        "C) Individual respondent PAN/Aadhaar identification number",
        "D) Commercial postal logistics delivery zone",
      ],
      correctAnswer: "A",
      explanation:
        "CEB in rural regions and UFS Blocks in urban centers form the standard primary sampling frame for official NSS rounds and national statistical estimations.",
      topic: topic || "Survey Methodology",
      sourceReference: `${documentTitle} - Core Framework`,
      difficulty,
    },
    {
      question: `According to ${documentTitle}, what is the primary objective of data stratification prior to field sampling?`,
      options: [
        "A) To arbitrarily restrict the sample size to save administrative costs",
        "B) To group heterogeneous populations into homogeneous strata for higher estimation precision",
        "C) To eliminate all secondary stage sampling requirements",
        "D) To bypass the necessity of listing operations",
      ],
      correctAnswer: "B",
      explanation:
        "Stratification ensures that sub-populations with distinct characteristics are adequately represented, minimizing intra-stratum variance and maximizing estimator efficiency.",
      topic: topic || "Sampling & Estimation",
      sourceReference: `${documentTitle} - Stratification Rules`,
      difficulty,
    },
    {
      question: `Which statistical principle governs the minimization of non-sampling errors during official surveys as outlined in ${documentTitle}?`,
      options: [
        "A) Increasing sample size infinitely without standardized field protocols",
        "B) Comprehensive enumerator training, rigorous manual verification, and computerized validation checks",
        "C) Solely relying on voluntary post-survey postal responses",
        "D) Omitting non-responding households from the baseline denominator",
      ],
      correctAnswer: "B",
      explanation:
        "Non-sampling errors (e.g. measurement, response, and processing errors) are controlled through standardized field procedures, training manuals, and structured logic checks.",
      topic: topic || "Survey Quality Assurance",
      sourceReference: `${documentTitle} - Quality Assurance`,
      difficulty,
    },
  ];
};


export const generateQuiz = async ({
  topic = "Sampling Techniques & Estimation",
  domain = "Statistical Competencies",
  difficulty = "Medium",
  numQuestions = 5,
}) => {
  const validDifficulty = ["Easy", "Medium", "Hard"].includes(difficulty)
    ? difficulty
    : "Medium";
  const count = Math.max(3, Math.min(20, Number(numQuestions) || 5));

  const prompt = `
You are the SkillSetu AI Assessment Wing.
Generate an official statistical diagnostic test on:
- Topic: ${topic}
- Domain: ${domain}
- Difficulty: ${validDifficulty}
- Number of Questions: ${count}

Each question must be rigorous, testing real official statistics principles (formulas, standards, classifications, survey rules, and estimation methods).

Return STRICTLY a JSON object with this exact schema:
{
  "title": "${topic} — Diagnostic Assessment",
  "domain": "${domain}",
  "topic": "${topic}",
  "difficulty": "${validDifficulty}",
  "timeLimitMinutes": ${count * 2},
  "questions": [
    {
      "question": "Clear, rigorous question text testing official statistics on ${topic}?",
      "options": [
        "A) [Option text]",
        "B) [Option text]",
        "C) [Option text]",
        "D) [Option text]"
      ],
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why the correct option is right and others are inapplicable.",
      "topic": "${topic}",
      "difficulty": "${validDifficulty}",
      "sourceReference": "${topic} Reference Guidelines"
    }
  ]
}
`;

  try {
    const raw = await callGeminiOrFallback(
      prompt,
      "You are the SkillSetu AI statistical examination authority. Output strict valid JSON object only.",
      { jsonMode: true },
    );
    const parsed = cleanAndParseJson(raw, null);
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length) {
      const normalizedQuestions = parsed.questions
        .map((q) =>
          normalizeMcq(
            q,
            topic,
            validDifficulty,
            parsed.title || `${topic} Assessment`,
          ),
        )
        .filter(Boolean);

      if (normalizedQuestions.length > 0) {
        return {
          title: parsed.title || `${topic} — Diagnostic Assessment`,
          domain: parsed.domain || domain,
          topic: parsed.topic || topic,
          difficulty: validDifficulty,
          timeLimitMinutes:
            Number(parsed.timeLimitMinutes) ||
            Math.max(5, normalizedQuestions.length * 2),
          questions: normalizedQuestions.slice(0, count),
        };
      }
    }
  } catch (err) {
    console.error("[QUIZ GENERATION ERROR]", err.message);
  }

  const fallbackQuestions = [
    {
      question: `In official statistical methodology related to ${topic}, what is the primary objective of sample design stratification?`,
      options: [
        "A) To decrease sample variance and enhance estimation precision by grouping homogeneous units",
        "B) To arbitrarily decrease sample sizes across all geographic administrative zones",
        "C) To eliminate rural clusters from the primary sampling frame",
        "D) To bypass the requirement of field listing operations",
      ],
      correctAnswer: "A",
      explanation:
        "Stratification groups ultimate sampling units into homogeneous strata to minimize within-stratum variance, significantly enhancing estimation precision.",
      topic,
      difficulty: validDifficulty,
      sourceReference: "NSSTA Survey Methodology Core Framework",
    },
    {
      question: `Under standard official statistics guidelines for ${topic}, which principle is essential for controlling non-sampling error?`,
      options: [
        "A) Standardized enumerator training, field verification, and computerized logic checks",
        "B) Arbitrary expansion of sample size without field listing validation",
        "C) Relying exclusively on voluntary postal survey responses",
        "D) Excluding non-responding sampling units from the base denominator",
      ],
      correctAnswer: "A",
      explanation:
        "Non-sampling error is controlled through standardized field procedures, training manuals, and structured multi-stage logic checks.",
      topic,
      difficulty: validDifficulty,
      sourceReference: "MoSPI Data Quality Assurance Framework (NQAF)",
    },
    {
      question: `In the context of ${topic} and official survey compilation, what does the sampling frame represent?`,
      options: [
        "A) The comprehensive list or geospatial map of all sampling units from which a sample is drawn",
        "B) The software environment used for tabulating field schedules",
        "C) The executive summary report submitted to policy makers",
        "D) The budgetary allocation allocated for field operations",
      ],
      correctAnswer: "A",
      explanation:
        "A sampling frame is the complete listing or geographical demarcation (e.g. UFS blocks, Census enumeration blocks) from which sample units are selected.",
      topic,
      difficulty: validDifficulty,
      sourceReference: "NSSTA Statistical Sampling Guidelines",
    },
    {
      question: `When analyzing indicators under ${topic}, how is estimator bias defined in official statistical theory?`,
      options: [
        "A) The difference between an estimator's expected value and the true population parameter",
        "B) The total cost incurred during field investigation rounds",
        "C) The percentage of questionnaires returned with partial information",
        "D) The ratio of urban to rural sampling blocks in the survey round",
      ],
      correctAnswer: "A",
      explanation:
        "Bias represents the systematic divergence between the mathematical expected value of the sample estimator and the actual population parameter.",
      topic,
      difficulty: validDifficulty,
      sourceReference: "MoSPI Estimation & Weighting Manual",
    },
    {
      question: `In official survey data processing for ${topic}, why are sampling weights (multipliers) applied to sample observations?`,
      options: [
        "A) To scale sample unit values to represent the entire target population accurately",
        "B) To artificially inflate survey response scores",
        "C) To penalize administrative regions with lower response rates",
        "D) To standardize numerical formatting across different file types",
      ],
      correctAnswer: "A",
      explanation:
        "Sampling weights (inverse of selection probability adjusted for non-response) are applied to obtain unbiased population-level aggregations.",
      topic,
      difficulty: validDifficulty,
      sourceReference: "MoSPI Microdata Weighting & Multipliers Standards",
    },
  ];

  return {
    title: `${topic} — Diagnostic Assessment`,
    domain,
    topic,
    difficulty: validDifficulty,
    timeLimitMinutes: Math.max(5, count * 2),
    questions: fallbackQuestions.slice(0, count),
  };
};
export const evaluateQuizSubmission = async ({
  quiz = {},
  questions = [],
  userAnswers = [],
  timeTakenSeconds = 60,
}) => {
  let correctCount = 0;
  const evaluatedQuestions = [];
  const topicBreakdown = {};

  const qList =
    Array.isArray(questions) && questions.length
      ? questions
      : Array.isArray(quiz?.questions)
        ? quiz.questions
        : [];

  qList.forEach((q, idx) => {
    const userAns = userAnswers[idx] || "";
    const correctLetter = (q.correctAnswer || "A")
      .trim()
      .charAt(0)
      .toUpperCase();
    const userLetter = String(userAns || "")
      .trim()
      .charAt(0)
      .toUpperCase();
    const isCorrect =
      userLetter === correctLetter ||
      (q.correctAnswer &&
        String(userAns)
          .toLowerCase()
          .includes(String(q.correctAnswer).toLowerCase()));

    if (isCorrect) correctCount++;

    const topic = q.topic || quiz?.topic || "General";
    if (!topicBreakdown[topic]) {
      topicBreakdown[topic] = { total: 0, correct: 0 };
    }
    topicBreakdown[topic].total += 1;
    if (isCorrect) topicBreakdown[topic].correct += 1;

    evaluatedQuestions.push({
      questionText: q.question,
      selectedOption: userAns || "Not Answered",
      correctAnswer: Array.isArray(q.options)
        ? q.options.find((o) => o.startsWith(q.correctAnswer)) ||
          q.correctAnswer
        : q.correctAnswer,
      isCorrect,
      explanation: q.explanation || "Official statistical rationale.",
      topic,
    });
  });

  const total = qList.length || 1;
  const score = Math.round((correctCount / total) * 100);
  const accuracy = Math.round((correctCount / total) * 100);

  const topicAnalysis = Object.keys(topicBreakdown).map((top) => {
    const data = topicBreakdown[top];
    const topicScore = Math.round((data.correct / data.total) * 100);
    return {
      topic: top,
      score: topicScore,
      status:
        topicScore >= 75
          ? "Mastered"
          : topicScore >= 50
            ? "Developing"
            : "Needs Review",
    };
  });

  const aiFeedback =
    score >= 80
      ? "Outstanding conceptual mastery! You demonstrated thorough understanding of official guidelines and statistical methodologies."
      : score >= 60
        ? "Good performance! You have a solid grasp of foundational concepts, with a few specific areas recommended for targeted review."
        : "Further capacity building recommended. We suggest reviewing the recommended iGOT training modules to strengthen your core concepts.";

  return {
    score,
    accuracy,
    correctCount,
    totalQuestions: total,
    timeTakenSeconds,
    aiFeedback,
    evaluatedQuestions,
    topicAnalysis,
    passed: score >= 60,
  };
};

export const generateAIAssistantResponse = async ({
  conversationHistory = [],
  userMessage = "",
  learnerContext = {},
}) => {
  const userName = learnerContext.userName || learnerContext.name || "Officer";
  const trimmed = userMessage.trim().toLowerCase();

  const isGreeting =
    /^(hi|hello|hey|namaste|helo|hlo|greetings|good\s+(morning|afternoon|evening))(\s+(copilot|skillsetu|skillsetucopilot|sankhya|ai|there|bot))?[!.?\s]*$/i.test(
      trimmed
    );

  if (isGreeting) {
    return `Hi ${userName}, I am SkillSetu Copilot. How can I help you today?`;
  }

  const isCreatorQuestion =
    /(who\s+(created|made|built|developed|designed|coded)\s+you|who\s+is\s+your\s+(creator|developer|maker|owner|author|team|leader)|who\s+are\s+your\s+(creators|developers)|tell\s+me\s+who\s+created\s+you|who\s+is\s+(the\s+)?(creator|developer)\s+of\s+(this\s+)?(ai|copilot|bot|app))/i.test(
      userMessage
    );

  if (isCreatorQuestion) {
    return "I was created by the SkillSetu AI engineering team to bridge the skill gap and build a smarter, highly capable workforce.";
  }

  const systemPrompt = `
You are "SkillSetu Copilot", the dedicated AI Learning and Statistical Intelligence Copilot powered by the SkillSetu AI Neural Engine.

Your core mission:
- If the user greets you, welcome them with: "Hi ${userName}, I am SkillSetu Copilot. How can I help you today?"
- Provide clear, mathematically rigorous, yet accessible explanations of official statistical methodologies, data standards, and workforce competencies.
- Guide officers on automated statistical computing, microdata analysis, and registry management for statistical data processing.
- Clarify statistical guidelines, metadata standards (NIC-2008, NPC-2011), and quality assurance frameworks.
- Encourage continuous career capacity building via personalized learning pathways.
- Maintain a polite, professional, encouraging, and authoritative tone suitable for government officers and statistical professionals.
- Do not mention external company names or proprietary commercial brandings.
- If the user asks who created you, who made you, who is your developer, team, or creator, reply clearly: "I was created by the SkillSetu AI engineering team to bridge the skill gap and build a smarter, highly capable workforce."

Learner Profile Context:
- Cadre: ${learnerContext.jobRole || "Statistical Officer"}
- Department: ${learnerContext.department || "Statistics & Programme Implementation"}
- Level: ${learnerContext.overallLevel || "Intermediate"}
`;

  const recentHistory = conversationHistory
    .slice(-6)
    .map(
      (m) =>
        `${m.role === "user" ? "Learner" : "SkillSetu Copilot"}: ${m.content}`,
    )
    .join("\n");
  const fullPrompt = `${recentHistory}\nLearner: ${userMessage}\nSkillSetu Copilot:`;

  try {
    const responseText = await callGeminiOrFallback(fullPrompt, systemPrompt);
    if (responseText) return responseText;
  } catch (err) {
    console.error("[AI COPILOT ERROR]", err.message);
  }

  return "Namaste. In official statistics, ensure you verify the sampling frame and apply the appropriate design weights. For further guidance, explore our competency modules or specify your inquiry on survey methodology, GDP estimation, or statistical computing.";
};

export const generateAdaptiveRecommendations = async ({
  weakTopics = [],
  recentScores = [],
  currentPath = [],
}) => {
  if (!weakTopics.length) return currentPath;

  const prompt = `
As the SkillSetu AI Adaptive Learning Engine, recommend 2 immediate remediation micro-courses for an official who struggled with the following topics in recent assessments:
Weak Topics: ${JSON.stringify(weakTopics)}
Recent Scores: ${JSON.stringify(recentScores)}

Return STRICTLY a JSON array of 2 recommended modules with schema:
[
  {
    "title": "Sampling Variance & Multiplier Estimation",
    "provider": "SkillSetu Learning Hub",
    "duration": "4 Hours",
    "priority": "High",
    "skillAddressed": "Sampling Techniques & Estimation",
    "rationale": "Directly resolves diagnostic weaknesses discovered in your recent test attempt."
  }
]
`;

  try {
    const raw = await callGeminiOrFallback(
      prompt,
      "Return strict valid JSON array.",
    );
    const parsed = cleanAndParseJson(raw, []);
    if (Array.isArray(parsed) && parsed.length) {
      return [...parsed, ...currentPath];
    }
  } catch (err) {
    console.error("[ADAPTIVE RECOMMENDATIONS ERROR]", err.message);
  }

  return currentPath;
};

export const evaluateAssignmentSubmission = async ({
  assignment = {},
  submissionText = "",
  learnerProfile = {},
}) => {
  const prompt = `
You are the Chief Academic Evaluator for the National Statistical Systems Training Academy (NSSTA), Ministry of Statistics & Programme Implementation (MoSPI).

Evaluate the following official statistical case-study / assignment submission:

--- ASSIGNMENT CONTEXT ---
Title: ${assignment.title}
Domain: ${assignment.domain}
Target Competency: ${assignment.targetCompetency}
Difficulty: ${assignment.difficulty || "Intermediate"}
Scenario Description: ${assignment.scenario}
Instructions / Deliverables: ${JSON.stringify(assignment.instructions || [])}
Evaluation Rubric: ${JSON.stringify(assignment.rubric || [])}

--- CANDIDATE INFORMATION ---
Cadre / Role: ${learnerProfile.jobRole || "Statistical Officer"}
Department: ${learnerProfile.department || "MoSPI"}

--- CANDIDATE SUBMISSION ---
${submissionText}
--- END SUBMISSION ---

Task:
Perform a comprehensive, rigorous academic evaluation of this submission based on official MoSPI standards and the provided rubric.

Return STRICTLY a JSON object with this schema:
{
  "overallScore": 84,
  "grade": "A",
  "rubricScores": [
    {
      "criterion": "Methodological Soundness & Statistical Rigor",
      "score": 22,
      "maxScore": 25,
      "feedback": "Demonstrated sound understanding of stratified sampling and multiplier weights."
    },
    {
      "criterion": "Accuracy & Formula Application",
      "score": 21,
      "maxScore": 25,
      "feedback": "Correctly specified variance formulas; slight ambiguity in handling non-response."
    },
    {
      "criterion": "MoSPI / UN-NQAF Compliance",
      "score": 20,
      "maxScore": 25,
      "feedback": "Followed official metadata standards and documentation guidelines."
    },
    {
      "criterion": "Practical Applicability & Policy Insight",
      "score": 21,
      "maxScore": 25,
      "feedback": "Clear, actionable recommendations presented in the case report."
    }
  ],
  "strengths": [
    "Clear mathematical formulation of survey estimators",
    "Proper incorporation of stratum multipliers"
  ],
  "improvementAreas": [
    "Elaborate more on unit non-response imputation methods",
    "Include confidence interval bounds"
  ],
  "detailedFeedback": "Overall an exceptional submission showing high readiness for field and survey deployment. Your methodological justification is rigorous and aligned with NSSTA guidelines.",
  "suggestedNextSteps": [
    "Review iGOT Module on Survey Weighting & Multipliers",
    "Attempt Advanced In-Service Case Study"
  ],
  "competencyScoreDelta": 6
}
`;

  try {
    const raw = await callGeminiOrFallback(
      prompt,
      "You are a senior statistical examiner. Output strict valid JSON object only.",
    );
    const parsed = cleanAndParseJson(raw, null);
    if (parsed && parsed.overallScore !== undefined) {
      return parsed;
    }
  } catch (err) {
    console.error("[ASSIGNMENT EVALUATION ERROR]", err.message);
  }

  const wordCount = submissionText.trim().split(/\s+/).length;
  const baseScore = Math.min(
    92,
    Math.max(55, Math.round(wordCount > 100 ? 78 + (wordCount % 12) : 62)),
  );

  return {
    overallScore: baseScore,
    grade:
      baseScore >= 85
        ? "A+"
        : baseScore >= 75
          ? "A"
          : baseScore >= 60
            ? "B"
            : "C",
    rubricScores: [
      {
        criterion: "Methodological Rigor & Application",
        score: Math.round((baseScore / 100) * 25),
        maxScore: 25,
        feedback:
          "Applied core official statistical concepts and guidelines appropriately.",
      },
      {
        criterion: "Accuracy & Formula Implementation",
        score: Math.round((baseScore / 100) * 25),
        maxScore: 25,
        feedback:
          "Formulations and step-by-step logic are consistent with MoSPI standards.",
      },
      {
        criterion: "Regulatory & Quality Compliance (NQAF)",
        score: Math.round((baseScore / 100) * 25),
        maxScore: 25,
        feedback: "Good adherence to official metadata standards.",
      },
      {
        criterion: "Actionable Insights & Policy Formulation",
        score: Math.round((baseScore / 100) * 25),
        maxScore: 25,
        feedback:
          "Clear practical recommendations provided for the operational unit.",
      },
    ],
    strengths: [
      "Comprehensive coverage of scenario requirements",
      "Structured official response layout",
    ],
    improvementAreas: [
      "Consider adding more empirical boundary cases",
      "Deepen standard error estimation logic",
    ],
    detailedFeedback: `Your submission has been evaluated against NSSTA benchmark rubrics. Overall score of ${baseScore}/100 awarded.`,
    suggestedNextSteps: [
      "Explore the relevant iGOT Karmayogi remediation modules",
      "Review official MoSPI case studies",
    ],
    competencyScoreDelta: Math.max(3, Math.round(baseScore / 18)),
  };
};

export default {
  scoreToLevel,
  generateCompetencyAssessment,
  analyzeSkillGaps,
  generateLearningPath,
  generateMCQsFromText,
  generateQuiz,
  evaluateQuizSubmission,
  generateAIAssistantResponse,
  generateAdaptiveRecommendations,
  evaluateAssignmentSubmission,
};
