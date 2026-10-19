import dotenv from "dotenv";

dotenv.config();

export const TPAC_PROGRAMMES = [
    {
        id: "tpac-2026-01",
        title: "Advanced Sampling Methodologies & Small Area Estimation",
        academy: "NSSTA Greater Noida",
        mode: "Residential / Hybrid",
        targetCadre: ["Indian Statistical Service (ISS) Officer", "Senior Statistical Officer (SSO)"],
        durationWeeks: 2,
        credits: 40,
        competencyAddressed: "Sampling Techniques & Estimation",
        curriculum: [
            "Probability Proportional to Size (PPS) Systematic Sampling",
            "Multi-stage Stratified Cluster Sampling",
            "Small Area Estimation (SAE) via Empirical Bayes & Fay-Herriot Models",
            "Variance Estimation in Complex Survey Designs using Jackknife & Bootstrap",
        ],
        dates: "Sept 15 - Sept 26, 2026",
        coordinator: "Director (Sampling Division), NSSTA",
    },
    {
        id: "tpac-2026-02",
        title: "System of National Accounts (SNA 2008 & 2025 Updates) & Supply-Use Tables",
        academy: "NSSTA Greater Noida (in collab with NAD, CSO)",
        mode: "In-Person Intensive",
        targetCadre: ["Indian Statistical Service (ISS) Officer", "Director / Division Head (CSO / NSSO)"],
        durationWeeks: 3,
        credits: 60,
        competencyAddressed: "National Accounts & GDP Compilation",
        curriculum: [
            "Sequence of Accounts & Institutional Sectoring",
            "Compilation of Gross Capital Formation & GFCF",
            "Input-Output Transactions Tables (IOTT) and SUT 140x140",
            "Financial Accounts & Balance Sheets in Official Statistics",
        ],
        dates: "Oct 12 - Oct 30, 2026",
        coordinator: "Additional Director General, National Accounts Division",
    },
    {
        id: "tpac-2026-03",
        title: "Modern Field Survey Operations, CAPI & Digital Quality Auditing",
        academy: "NSSTA Regional Centre / FOD Zones",
        mode: "Residential & Field Practicum",
        targetCadre: ["Junior Statistical Officer (JSO)", "Field Operations / Investigator (FOD)"],
        durationWeeks: 2,
        credits: 35,
        competencyAddressed: "Survey Design & Methodologies",
        curriculum: [
            "Computer Assisted Personal Interviewing (CAPI) Tablet Setup",
            "Paradata Analysis for Field Surveyor Verification",
            "Household Listing & Sampling Selection Protocol",
            "Data Validation Rules, Consistency Checks & Range Limits",
        ],
        dates: "Nov 02 - Nov 13, 2026",
        coordinator: "Joint Director, Field Operations Division (FOD)",
    },
    {
        id: "tpac-2026-04",
        title: "Applied AI, Machine Learning & Geospatial Mapping in Official Statistics",
        academy: "NSSTA & IIT/ISI Collaborative Lab",
        mode: "Hybrid",
        targetCadre: ["Data Scientist / Statistical Analyst", "Indian Statistical Service (ISS) Officer"],
        durationWeeks: 2,
        credits: 45,
        competencyAddressed: "AI & Machine Learning for Official Statistics",
        curriculum: [
            "Machine Learning Algorithms for Automated Industry/Occupation Coding",
            "Satellite & Geospatial Data for Agricultural Yield Estimation",
            "NLP for Consumer Price Scraping & Sentiment Proxies",
            "Responsible AI & Algorithmic Fairness in Government Analytics",
        ],
        dates: "Nov 23 - Dec 04, 2026",
        coordinator: "Director (Computer Centre & AI), MoSPI",
    },
    {
        id: "tpac-2026-05",
        title: "SDG National Indicator Framework (NIF) Monitoring & Data Dissemination",
        academy: "NSSTA Greater Noida (with UN-ESCAP / NITI Aayog)",
        mode: "Workshop / Hybrid",
        targetCadre: ["Senior Statistical Officer (SSO)", "Indian Statistical Service (ISS) Officer"],
        durationWeeks: 1,
        credits: 20,
        competencyAddressed: "SDG National Indicator Framework (NIF)",
        curriculum: [
            "Alignment of Global SDG Indicators with MoSPI NIF 3.0",
            "State Indicator Framework (SIF) & District Indicator Framework (DIF)",
            "Data Gaps, Tier Classification & Metadata Harmonization",
            "National SDG Dashboard Architecture & Visual Reporting",
        ],
        dates: "Dec 07 - Dec 11, 2026",
        coordinator: "Director (SDG Division), MoSPI",
    },
];

export const getTpacProgrammes = (cadre = "", competency = "") => {
    let list = [...TPAC_PROGRAMMES];
    if (cadre) {
        list = list.filter((p) => p.targetCadre.some((c) => c.toLowerCase().includes(cadre.toLowerCase())));
    }
    if (competency) {
        list = list.filter((p) => p.competencyAddressed.toLowerCase().includes(competency.toLowerCase()));
    }
    return list;
};

export const getTpacRecommendationsForLearner = (learnerCadre = "", skillGaps = []) => {
    const recommended = [];

    (skillGaps || []).forEach((gap) => {
        if (!gap || !gap.competencyName) return;
        const found = TPAC_PROGRAMMES.find(
            (p) =>
                p.competencyAddressed.toLowerCase().includes(gap.competencyName.toLowerCase()) ||
                gap.competencyName.toLowerCase().includes(p.competencyAddressed.toLowerCase())
        );
        if (found && !recommended.some((r) => r.id === found.id)) {
            recommended.push({
                ...found,
                recommendationReason: `NSSTA TPAC Programme specifically addressing ${gap.priority || "Medium"} Priority Gap in ${gap.competencyName}`,
                priority: gap.priority || "Medium",
            });
        }
    });

    if (learnerCadre) {
        TPAC_PROGRAMMES.forEach((p) => {
            if (
                p.targetCadre.some((c) => c.toLowerCase().includes(learnerCadre.toLowerCase())) &&
                !recommended.some((r) => r.id === p.id)
            ) {
                recommended.push({
                    ...p,
                    recommendationReason: `Mandatory/Recommended In-Service Training for ${learnerCadre}`,
                    priority: "Medium",
                });
            }
        });
    }

    if (!recommended.length) {
        return TPAC_PROGRAMMES.slice(0, 3);
    }
    return recommended.slice(0, 4);
};

export default {
    TPAC_PROGRAMMES,
    getTpacProgrammes,
    getTpacRecommendationsForLearner,
};
