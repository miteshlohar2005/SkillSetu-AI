import Quiz from "../models/quizModel.js";
import Interview from "../models/interviewModel.js";
import { generateQuiz } from "./aiService.js";
import { askAi } from "./openRouter.service.js";

export const CADRE_DIAGNOSTIC_PRESETS = {
  "Indian Statistical Service (ISS) Officer": {
    quiz: {
      topic: "National Statistical Architecture & Methodologies",
      questions: [
        {
          question:
            "Under the System of National Accounts (SNA 2008), which approach is used to compile Gross Value Added (GVA) at basic prices?",
          options: [
            "A) Output at basic prices minus Intermediate Consumption at purchasers' prices",
            "B) GDP at market prices minus Indirect Taxes plus Subsidies",
            "C) Sum of Employee Compensation plus Gross Operating Surplus only",
            "D) Total Final Consumption Expenditure plus Net Exports",
          ],
          correctAnswer: "A",
          explanation:
            "GVA at basic prices is defined as Output valued at basic prices minus Intermediate Consumption valued at purchasers' prices.",
          topic: "National Accounts & GDP Compilation",
          difficulty: "Medium",
        },
        {
          question:
            "In stratified multi-stage sampling adopted by NSSO (PLFS/HIES), what constitutes the First Stage Unit (FSU) in rural and urban sectors?",
          options: [
            "A) Census Villages in rural sectors and Urban Frame Survey (UFS) blocks in urban sectors",
            "B) Gram Panchayats in rural sectors and Municipal Wards in urban sectors",
            "C) Agricultural Households in rural and Enumeration Blocks in urban",
            "D) Revenue Districts in rural and Census Enumeration Districts in urban",
          ],
          correctAnswer: "A",
          explanation:
            "In NSSO household surveys, FSUs are Census Villages in the rural sector and UFS (Urban Frame Survey) blocks in the urban sector.",
          topic: "Sampling Techniques & Estimation",
          difficulty: "Medium",
        },
        {
          question:
            "Which index formula is currently utilized by the Central Statistics Office (CSO/NSO) for compiling the Consumer Price Index (CPI)?",
          options: [
            "A) Modified Laspeyres Index Formula with fixed base weights",
            "B) Paasche Index Formula with current period basket",
            "C) Fisher's Ideal Index Formula using geometric mean",
            "D) Tornqvist Superlative Index Formula",
          ],
          correctAnswer: "A",
          explanation:
            "The All India Consumer Price Index (CPI) compiles series using the Laspeyres base-weighted price index formula.",
          topic: "Price Statistics (CPI, WPI, Inflation)",
          difficulty: "Medium",
        },
        {
          question:
            "Under the National Quality Assurance Framework (NQAF), which prerequisite guarantees the credibility and public trust of official statistics?",
          options: [
            "A) Professional independence and statistical confidentiality",
            "B) Sole reliance on administrative registry data without audits",
            "C) Mandatory prior clearance by departmental executive boards",
            "D) Continuous daily real-time metric adjustments",
          ],
          correctAnswer: "A",
          explanation:
            "Professional independence and strict statistical confidentiality of respondents are cornerstone pillars of UN-NQAF and MoSPI standards.",
          topic: "Data Quality Assurance & NQAF",
          difficulty: "Medium",
        },
        {
          question:
            "Under the Digital Personal Data Protection (DPDP) Act 2023, how must microdata containing individual identifiers be treated before public research dissemination?",
          options: [
            "A) Strict statistical anonymization, pseudonymization, and de-identification",
            "B) Disseminated in raw form provided researchers sign an informal MoU",
            "C) Restricted only to hardcopy physical archives",
            "D) Subject to mandatory commercial licensing fees",
          ],
          correctAnswer: "A",
          explanation:
            "The DPDP Act and MoSPI dissemination policy mandate rigorous mathematical anonymization and removal of direct identifiers prior to public release.",
          topic: "Data Privacy, Ethics & Anonymization",
          difficulty: "Medium",
        },
      ],
    },
    viva: [
      {
        question:
          "As an ISS Officer leading a large-scale socioeconomic survey, how would you design the sampling frame to minimize both sampling and non-sampling errors?",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "Explain the transition and methodological differences between GDP compilation under SNA 1993 versus SNA 2008 in the Indian context.",
        difficulty: "hard",
        timeLimit: 120,
      },
      {
        question:
          "In the Periodic Labour Force Survey (PLFS), how do you conceptually distinguish between Usual Status (ps+ss) and Current Weekly Status (CWS)?",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "How do you ensure strict compliance with the National Quality Assurance Framework (NQAF) during field scrutiny and computer-assisted personal interviewing (CAPI)?",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "Describe your approach to communicating complex statistical indicators and uncertainty margins to non-technical policy executives.",
        difficulty: "easy",
        timeLimit: 60,
      },
    ],
  },
  "Subordinate Statistical Service (SSS) Officer": {
    quiz: {
      topic: "Survey Scrutiny & Field Data Validation",
      questions: [
        {
          question:
            "During the scrutiny of survey schedules, which check verifies that total household consumer expenditure equals the sum of itemized sub-totals?",
          options: [
            "A) Arithmetic consistency and internal reconciliation check",
            "B) Independent multiplier verification",
            "C) Stratum boundary reassessment",
            "D) FSU substitution protocol",
          ],
          correctAnswer: "A",
          explanation:
            "Arithmetic scrutiny confirms that row totals and sub-item aggregations reconcile without discrepancy.",
          topic: "Survey Scrutiny & Data Validation",
          difficulty: "Medium",
        },
        {
          question:
            "In household socioeconomic surveys, how is a temporary visitor (guest staying for less than 30 days) treated for household member roster listing?",
          options: [
            "A) Excluded from the normal household member roster",
            "B) Listed as the primary economic earner",
            "C) Assigned a separate individual schedule",
            "D) Included only if they contribute to household income",
          ],
          correctAnswer: "A",
          explanation:
            "Official survey standards define a normal resident as one who normally resides and shares a common kitchen; temporary visitors (<30 days) are excluded.",
          topic: "Field Survey Methodologies",
          difficulty: "Medium",
        },
        {
          question:
            "What is the formula for the sample weight (multiplier) in an equal probability simple random sample without replacement (SRSWOR) of size n from population N?",
          options: [
            "A) Multiplier = N / n",
            "B) Multiplier = n / N",
            "C) Multiplier = (N - n) / N",
            "D) Multiplier = sqrt(N * n)",
          ],
          correctAnswer: "A",
          explanation:
            "The inverse of selection probability (1 / (n/N)) gives the multiplier N/n.",
          topic: "Sampling Techniques & Multipliers",
          difficulty: "Medium",
        },
        {
          question:
            "When canvassing the Periodic Labour Force Survey (PLFS), how is 'usual status' (ps+ss) defined for employment measurement?",
          options: [
            "A) Activity pursued for relatively long time (major time criterion) during the 365 days preceding date of survey",
            "B) Activity pursued on each day of the previous 7 days",
            "C) Activity pursued for at least 1 hour on any single day of reference week",
            "D) Activity contractually planned for the forthcoming calendar quarter",
          ],
          correctAnswer: "A",
          explanation:
            "Usual status determines economic activity based on the major time spent during the 365 days reference period.",
          topic: "Labour & Employment Statistics (PLFS)",
          difficulty: "Medium",
        },
        {
          question:
            "Under official data standards, what is the mandatory immediate action when a selected sample household has permanently migrated and left the hamlet?",
          options: [
            "A) Follow prescribed casualty/substitution guidelines from the random reserve roster",
            "B) Impute synthetic values based on the investigator's personal intuition",
            "C) Fabricate proxy responses from unrelated neighbors",
            "D) Discard the entire FSU without logging the non-response",
          ],
          correctAnswer: "A",
          explanation:
            "Authorized survey protocol specifies utilizing pre-selected casualty reserve units according to systematic sampling rules.",
          topic: "Survey Administration & Ethics",
          difficulty: "Medium",
        },
      ],
    },
    viva: [
      {
        question:
          "Describe how you perform field schedule scrutiny to detect illogical or contradictory entries made during canvassing.",
        difficulty: "easy",
        timeLimit: 60,
      },
      {
        question:
          "How do you handle household non-contact or refusal in sensitive socioeconomic and expenditure surveys?",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "Explain the difference between sampling error and non-sampling error in large-scale sample surveys.",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "How do you ensure proper storage and confidential handling of completed paper schedules and CAPI devices?",
        difficulty: "easy",
        timeLimit: 60,
      },
    ],
  },
  "Field Operations Division (FOD) Investigator": {
    quiz: {
      topic: "Field Canvassing, Frame Updating & Survey Operations",
      questions: [
        {
          question:
            "In Urban Frame Survey (UFS) updating, what is the standard targeted household range for delineating an urban block?",
          options: [
            "A) 100 to 150 households",
            "B) 10 to 20 households",
            "C) 500 to 1,000 households",
            "D) 1,500 to 2,000 households",
          ],
          correctAnswer: "A",
          explanation:
            "An Urban Frame Survey (UFS) block is ideally demarcated with clear boundaries encompassing approximately 100 to 150 households.",
          topic: "Urban Frame Survey (UFS) Operations",
          difficulty: "Medium",
        },
        {
          question:
            "When using Computer Assisted Personal Interviewing (CAPI) on mobile tablets, what is the primary purpose of geotagging at the respondent household location?",
          options: [
            "A) To verify physical inspection presence and audit geospatial spatial distribution",
            "B) To broadcast respondent addresses on public open maps",
            "C) To calculate household electricity consumption",
            "D) To replace demographic identification codes",
          ],
          correctAnswer: "A",
          explanation:
            "Geotagging in CAPI ensures field audit verification that interviews are canvassed in-person at the sampled location.",
          topic: "CAPI & Digital Field Survey Tools",
          difficulty: "Medium",
        },
        {
          question:
            "What is the first step in listing households in a selected rural First Stage Unit (Census Village)?",
          options: [
            "A) Boundary identification with local village officials and hamlet formation if population exceeds the prescribed threshold",
            "B) Immediately interviewing the first household reached at the village border",
            "C) Randomly knocking on ten doors without a prior frame",
            "D) Requesting village leaders to pick the wealthiest households",
          ],
          correctAnswer: "A",
          explanation:
            "The investigator must first identify official village boundaries and form hamlet groups if population exceeds guidelines.",
          topic: "Hamlet Demarcation & Listing",
          difficulty: "Medium",
        },
        {
          question:
            "Which parameter is monitored to minimize investigator bias during field data collection?",
          options: [
            "A) Strict adherence to standardized questionnaire wording without leading questions",
            "B) Paraphrasing questions using informal colloquial speculation",
            "C) Prompting respondents with preferred numerical answers",
            "D) Skipping sensitive modules without asking the respondent",
          ],
          correctAnswer: "A",
          explanation:
            "Investigators must use standard neutral phrasing to ensure measurement consistency across all sample units.",
          topic: "Field Survey Ethics & Non-sampling Controls",
          difficulty: "Medium",
        },
        {
          question:
            "In the Annual Survey of Industries (ASI), what document provides the primary sampling frame of manufacturing establishments?",
          options: [
            "A) Chief Inspector of Factories (CIF) register under the Factories Act, 1948",
            "B) Municipal residential property tax registers",
            "C) Personal social media business pages",
            "D) Telephone directory classifieds",
          ],
          correctAnswer: "A",
          explanation:
            "The ASI frame is drawn from the registered factory directories maintained by State Chief Inspectors of Factories.",
          topic: "Industrial & Establishment Surveys (ASI)",
          difficulty: "Medium",
        },
      ],
    },
    viva: [
      {
        question:
          "Walk through the procedure you follow when identifying the physical boundaries of an Urban Frame Survey (UFS) block on the ground.",
        difficulty: "easy",
        timeLimit: 60,
      },
      {
        question:
          "How do you establish rapport and gain the trust of a reluctant respondent who refuses to share financial or demographic information?",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "Explain the steps taken to ensure CAPI device battery management, offline data security, and end-of-day synchronization in remote areas.",
        difficulty: "easy",
        timeLimit: 60,
      },
      {
        question:
          "What criteria do you use to determine whether a large village requires hamlet-group formation before listing?",
        difficulty: "medium",
        timeLimit: 90,
      },
    ],
  },
  default: {
    quiz: {
      topic: "Official Statistical Operations & Data Principles",
      questions: [
        {
          question:
            "What is the primary objective of stratifying a population before conducting random sampling?",
          options: [
            "A) To reduce sampling variance and ensure adequate representation of heterogeneous subgroups",
            "B) To eliminate the need for survey weighting and multipliers",
            "C) To increase the total interview sample size artificially",
            "D) To simplify physical travel for field enumerators",
          ],
          correctAnswer: "A",
          explanation:
            "Stratification groups homogeneous elements together, reducing the variance of estimators and ensuring representation across diverse domains.",
          topic: "Sampling Techniques & Estimation",
          difficulty: "Medium",
        },
        {
          question:
            "Which of the following describes the Current Weekly Status (CWS) measure of employment in NSSO surveys?",
          options: [
            "A) Activity status of a person determined on the basis of reference period of 7 days preceding the date of survey",
            "B) Activity status of a person over a 365-day major time disposition",
            "C) Monthly average formal payroll employment records",
            "D) Five-year census aggregate employment status",
          ],
          correctAnswer: "A",
          explanation:
            "Current Weekly Status evaluates employment based on a 7-day reference window prior to the interview.",
          topic: "Labour & Employment Statistics (PLFS)",
          difficulty: "Medium",
        },
        {
          question:
            "In statistical data processing, what is the purpose of imputation?",
          options: [
            "A) Estimating and replacing missing or inconsistent survey responses with plausible values",
            "B) Deleting any questionnaire that contains missing data",
            "C) Double-counting records with high variance",
            "D) Modifying inflation statistics to meet fiscal targets",
          ],
          correctAnswer: "A",
          explanation:
            "Imputation uses statistical models or donor matches to replace missing item responses without discarding valuable observation records.",
          topic: "Statistical Computing & Automated Survey Data Processing",
          difficulty: "Medium",
        },
        {
          question:
            "Which Indian classification standard is utilized to categorize economic industrial activities in surveys like the Annual Survey of Industries (ASI)?",
          options: [
            "A) National Industrial Classification (NIC)",
            "B) National Product Classification (NPC)",
            "C) Indian Trade Classification (ITC-HS)",
            "D) Standard Occupational Classification (SOC)",
          ],
          correctAnswer: "A",
          explanation:
            "The National Industrial Classification (NIC) is the official framework used for classifying economic activities in India.",
          topic: "Statistical Metadata & Classifications (NIC, NPC)",
          difficulty: "Medium",
        },
        {
          question:
            "What is the fundamental requirement for ethical handling of official administrative and statistical data under government privacy standards?",
          options: [
            "A) Data minimization, purpose limitation, and robust cryptographic protection",
            "B) Open unauthenticated public access to personal identifying credentials",
            "C) Permanent public retention of sensitive raw microdata",
            "D) Third-party commercial monetization without citizen consent",
          ],
          correctAnswer: "A",
          explanation:
            "Modern data governance frameworks mandate that statistical authorities minimize data collection to stated statutory purposes and encrypt identifiers.",
          topic: "Data Privacy, Ethics & Anonymization",
          difficulty: "Medium",
        },
      ],
    },
    viva: [
      {
        question:
          "Explain the core difference between probability sampling and non-probability sampling, and why official statistics mandate probability sampling.",
        difficulty: "easy",
        timeLimit: 60,
      },
      {
        question:
          "How do you detect and handle non-sampling errors such as response bias and measurement errors during survey field inspections?",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "What steps would you take to validate the accuracy and internal consistency of secondary statistical data before publishing an official report?",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "How does the Digital Personal Data Protection Act affect the storage, curation, and dissemination of government survey records?",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        question:
          "Explain how you manage team timelines and maintain morale during intensive, time-sensitive census or survey field operations.",
        difficulty: "easy",
        timeLimit: 60,
      },
    ],
  },
};

export const generateDiagnosticAssessmentsForUser = async (user) => {
  try {
    const userId = user._id;
    const cadre =
      user.jobRole ||
      user.targetCadre ||
      "Indian Statistical Service (ISS) Officer";

    let diagnosticQuiz = await Quiz.findOne({
      assignedTo: userId,
      isDiagnostic: true,
    });

    if (!diagnosticQuiz) {
      const preset =
        CADRE_DIAGNOSTIC_PRESETS[cadre] || CADRE_DIAGNOSTIC_PRESETS.default;

      try {
        const aiGen = await generateQuiz({
          topic: `${cadre} Core Competencies & Methodology`,
          domain: "Statistical Competencies",
          difficulty: "Medium",
          numQuestions: 5,
        });

        if (
          aiGen &&
          Array.isArray(aiGen.questions) &&
          aiGen.questions.length >= 4
        ) {
          diagnosticQuiz = await Quiz.create({
            title: `Cadre Diagnostic Assessment • ${cadre}`,
            domain: "Statistical Competencies",
            topic: `${cadre} Baseline Evaluation`,
            difficulty: "Medium",
            timeLimitMinutes: 15,
            passingScore: 60,
            questions: aiGen.questions.map((q, idx) => ({
              question: q.question,
              options:
                Array.isArray(q.options) && q.options.length >= 4
                  ? q.options
                  : [
                      "A) Standard methodological convention",
                      "B) Alternative operational guideline",
                      "C) Secondary quality parameter",
                      "D) Inapplicable specification",
                    ],
              correctAnswer: q.correctAnswer || "A",
              explanation:
                q.explanation || "Official framework competency guideline.",
              topic: q.topic || "Statistical Competencies",
              difficulty: q.difficulty || "Medium",
            })),
            isDiagnostic: true,
            assignedTo: userId,
            targetCadre: cadre,
            createdBy: userId,
            isGeneratedByAI: true,
            isPublished: true,
          });
        }
      } catch (aiErr) {
        console.warn(
          "[DIAGNOSTIC AI QUIZ GEN WARN] Using high-fidelity preset:",
          aiErr.message,
        );
      }

      if (!diagnosticQuiz) {
        diagnosticQuiz = await Quiz.create({
          title: `Cadre Diagnostic Assessment • ${cadre}`,
          domain: "Statistical Competencies",
          topic: `${cadre} Baseline Evaluation`,
          difficulty: "Medium",
          timeLimitMinutes: 15,
          passingScore: 60,
          questions: preset.quiz.questions,
          isDiagnostic: true,
          assignedTo: userId,
          targetCadre: cadre,
          createdBy: userId,
          isGeneratedByAI: true,
          isPublished: true,
        });
      }
    }

    let diagnosticInterview = await Interview.findOne({
      userId,
      isDiagnostic: true,
    });

    if (!diagnosticInterview) {
      const preset =
        CADRE_DIAGNOSTIC_PRESETS[cadre] || CADRE_DIAGNOSTIC_PRESETS.default;

      diagnosticInterview = await Interview.create({
        userId,
        role: cadre,
        experience: String(user.workExperience || user.experienceYears || 1),
        mode: "Technical",
        isDiagnostic: true,
        targetCadre: cadre,
        status: "Incompleted",
        question: preset.viva.map((item) => ({
          question: item.question,
          difficulty: item.difficulty,
          timeLimit: item.timeLimit,
          score: 0,
          confidence: 0,
          communication: 0,
          correctness: 0,
          answer: "",
          feedback: "",
        })),
      });
    }

    return {
      diagnosticQuiz,
      diagnosticInterview,
    };
  } catch (error) {
    console.error("[GENERATE DIAGNOSTIC ASSESSMENTS ERROR]", error);
    return { diagnosticQuiz: null, diagnosticInterview: null };
  }
};
