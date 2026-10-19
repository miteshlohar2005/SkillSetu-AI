import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const applyOfficialDecorations = (doc, title, subtitle, docId) => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const headerHeight = i === 1 ? 38 : 24;

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    doc.setFillColor(255, 153, 51);
    doc.rect(0, headerHeight, pageWidth / 3, 2, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth / 3, headerHeight, pageWidth / 3, 2, "F");
    doc.setFillColor(19, 136, 8);
    doc.rect((pageWidth / 3) * 2, headerHeight, pageWidth / 3, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    if (i === 1) {
      doc.setFontSize(12);
      doc.text("SKILLSETU AI • WORKFORCE INTELLIGENCE RECORD", margin, 12);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(219, 234, 254);
      doc.text(
        "SkillSetu AI • Skill Intelligence & Capacity Building Platform",
        margin,
        18,
      );

      doc.setFontSize(7.5);
      doc.setTextColor(191, 219, 254);
      const headerMeta = `${title} | ID: ${docId || "SKILLSETU-REC"} | Date: ${new Date().toLocaleDateString("en-IN")}`;
      const splitMeta = doc.splitTextToSize(
        headerMeta,
        pageWidth - margin * 2 - 32,
      );
      doc.text(splitMeta[0] || headerMeta, margin, 25);

      doc.setFontSize(7);
      doc.setTextColor(147, 197, 253);
      doc.text(
        subtitle ||
          "SkillSetu AI • Competency Assessment & Workforce Development System",
        margin,
        32,
      );

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth - margin - 26, 9, 26, 7.5, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(30, 58, 138);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 13, 14.2, {
        align: "center",
      });
    } else {
      doc.setFontSize(9.5);
      doc.text(
        "SKILLSETU AI PLATFORM",
        margin,
        10.5,
      );

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(219, 234, 254);
      const runMeta = `${title} | Document ID: ${docId || "NSSTA-REC"}`;
      const splitRunMeta = doc.splitTextToSize(
        runMeta,
        pageWidth - margin * 2 - 32,
      );
      doc.text(splitRunMeta[0] || runMeta, margin, 17);

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth - margin - 26, 6.5, 26, 7.5, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(30, 58, 138);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 13, 11.7, {
        align: "center",
      });
    }

    const footerY = pageHeight - 14;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, footerY, pageWidth - margin * 2, 10, 2, 2, "F");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(
      "Verified Official Statistical Capacity Record • SkillSetu AI Neural Engine & NSSTA Intelligence Core",
      margin + 4,
      footerY + 4,
    );

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Integrated with iGOT Karmayogi (DoPT) & NSSTA TPAC Framework. Valid for Cadre Training Dossiers.",
      margin + 4,
      footerY + 7.5,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(30, 58, 138);
    doc.text("OFFICIAL RECORD", pageWidth - margin - 4, footerY + 5.8, {
      align: "right",
    });
  }
};

export const generateChatPDF = ({ chat, user }) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const docId = `CHAT-${(chat?._id || "session").slice(-6).toUpperCase()}`;

  let currentY = 44;
  const cardHeight = 26;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(
    margin,
    currentY,
    pageWidth - margin * 2,
    cardHeight,
    3,
    3,
    "FD",
  );

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const sessionTitle = `Session: ${chat?.name || "Statistical Methodology Consultation"}`;
  const splitTitle = doc.splitTextToSize(
    sessionTitle,
    pageWidth - margin * 2 - 10,
  );
  doc.text(splitTitle[0], margin + 5, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const officerName = user?.name || chat?.userName || "Statistical Officer";
  const dateStr = chat?.createdAt
    ? new Date(chat.createdAt).toLocaleString("en-IN")
    : new Date().toLocaleString("en-IN");
  const totalMsgs = chat?.messages?.length || 0;

  doc.text(`Officer / Inquirer: ${officerName}`, margin + 5, currentY + 13);
  doc.text(`Date & Time: ${dateStr}`, margin + 70, currentY + 13);
  doc.text(`Exchanges: ${totalMsgs} Messages`, margin + 135, currentY + 13);
  doc.text(
    "AI Model: SkillSetu AI Assistant (SkillSetu Copilot Neural)",
    margin + 5,
    currentY + 20,
  );

  currentY += cardHeight + 6;

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Consultation Transcript & Guidance Exchanges", margin, currentY);

  currentY += 3;

  const messages = chat?.messages || [];
  const tableData = messages.map((m, idx) => {
    const roleLabel =
      m.role === "user" ? `Officer (${officerName})` : "SkillSetu Copilot AI";
    const timeLabel = m.timestamp
      ? new Date(m.timestamp).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : `#${idx + 1}`;
    const cleanContent = (m.content || "")
      .replace(/[*#_`]/g, "")
      .replace(/\n\s*\n/g, "\n");
    return [idx + 1, roleLabel, timeLabel, cleanContent];
  });

  if (tableData.length === 0) {
    tableData.push([
      1,
      "System",
      "-",
      "No messages recorded in this chat session.",
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [["#", "Speaker", "Time", "Official Dialogue / Guidance Transcript"]],
    body: tableData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 38, fontStyle: "bold" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: "auto" },
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      overflow: "linebreak",
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        if (data.cell.raw === "SkillSetu Copilot AI") {
          data.cell.styles.textColor = [37, 99, 235];
        } else {
          data.cell.styles.textColor = [15, 23, 42];
        }
      }
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  applyOfficialDecorations(
    doc,
    "SkillSetu AI Consultation Record",
    "Conversational Statistical Methodology & MoSPI Circular Guidance Record",
    docId,
  );

  const filename = `SkillSetu_AI_Chatbot_${(chat?.name || "Transcript").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
};

export const generateInterviewPDF = ({ interview, user }) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const docId = `VIVA-${(interview?._id || "session").slice(-6).toUpperCase()}`;

  let currentY = 44;

  const rawQuestions =
    interview?.question ||
    interview?.questions ||
    interview?.questionWiseScore ||
    [];

  const score = interview?.finalScore || 0;
  let confidence = interview?.confidence || 0;
  let communication = interview?.communication || 0;
  let correctness = interview?.correctness || 0;

  if (
    (!confidence || !communication || !correctness) &&
    rawQuestions.length > 0
  ) {
    const validConf = rawQuestions.filter(
      (q) =>
        q.confidence !== undefined && q.confidence !== null && q.confidence > 0,
    );
    if (validConf.length > 0) {
      confidence = Number(
        (
          validConf.reduce((acc, q) => acc + (q.confidence || 0), 0) /
          validConf.length
        ).toFixed(1),
      );
      communication = Number(
        (
          validConf.reduce((acc, q) => acc + (q.communication || 0), 0) /
          validConf.length
        ).toFixed(1),
      );
      correctness = Number(
        (
          validConf.reduce((acc, q) => acc + (q.correctness || 0), 0) /
          validConf.length
        ).toFixed(1),
      );
    } else if (score > 0) {
      confidence = score;
      communication = score;
      correctness = score;
    }
  }

  const candidateName = user?.name || "Statistical Officer Candidate";
  const dateStr = interview?.createdAt
    ? new Date(interview.createdAt).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");

  const cardHeight = 30;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(
    margin,
    currentY,
    pageWidth - margin * 2,
    cardHeight,
    3,
    3,
    "FD",
  );

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const roleText = `Cadre Role: ${interview?.role || "Indian Statistical Service (ISS) Officer"}`;
  const splitRole = doc.splitTextToSize(roleText, pageWidth - margin * 2 - 45);
  doc.text(splitRole[0], margin + 5, currentY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);

  doc.text(`Candidate: ${candidateName}`, margin + 5, currentY + 13.5);
  doc.text(
    `Experience: ${interview?.experience || "Intermediate"}`,
    margin + 72,
    currentY + 13.5,
  );
  doc.text(`Assessment Date: ${dateStr}`, margin + 5, currentY + 19.5);
  doc.text(
    `Mode: ${(interview?.mode || "Technical").toUpperCase()} Viva Voce`,
    margin + 72,
    currentY + 19.5,
  );
  doc.text(
    `AI Model: AI Mock Interview (SkillSetu AI Oral Engine)`,
    margin + 5,
    currentY + 25.5,
  );
  doc.text(
    `Mode: ${(interview?.mode || "Technical").toUpperCase()} Viva Voce`,
    margin + 72,
    currentY + 25.5,
  );

  const badgeX = pageWidth - margin - 34;
  const badgeW = 30;
  const badgeH = 22;
  const badgeCenterX = badgeX + badgeW / 2;

  doc.setFillColor(
    score >= 8 ? 16 : score >= 5 ? 217 : 225,
    score >= 8 ? 185 : score >= 5 ? 119 : 29,
    score >= 8 ? 129 : score >= 5 ? 6 : 72,
  );
  doc.roundedRect(badgeX, currentY + 4, badgeW, badgeH, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("FINAL SCORE", badgeCenterX, currentY + 9.5, { align: "center" });

  doc.setFontSize(12);
  doc.text(`${score} / 10`, badgeCenterX, currentY + 16.5, { align: "center" });

  doc.setFontSize(6.5);
  doc.text("VIVA VOCE", badgeCenterX, currentY + 22, { align: "center" });

  currentY += cardHeight + 6;

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("1. Viva Voce Performance Dimensions", margin, currentY);

  currentY += 3;

  const metricData = [
    [
      "Confidence & Demeanor",
      `${confidence} / 10`,
      `${Math.round(confidence * 10)}%`,
      confidence >= 8
        ? "Excellent - Confident & Poised"
        : confidence >= 5
          ? "Adequate - Natural Delivery"
          : "Needs Polish & Voice Modulation",
    ],
    [
      "Technical Communication & Articulation",
      `${communication} / 10`,
      `${Math.round(communication * 10)}%`,
      communication >= 8
        ? "Clear, Structured & Precise"
        : communication >= 5
          ? "Moderate - Basic Terminology Clear"
          : "Needs Structured Explanation",
    ],
    [
      "Methodological Correctness & Domain Depth",
      `${correctness} / 10`,
      `${Math.round(correctness * 10)}%`,
      correctness >= 8
        ? "Rigorous, Accurate & MoSPI Compliant"
        : correctness >= 5
          ? "Partially Accurate - Solid Concepts"
          : "Significant Conceptual Gaps",
    ],
    [
      "Overall Board Assessment",
      `${score} / 10`,
      `${Math.round(score * 10)}%`,
      score >= 8
        ? "Cadre Ready - High Suitability"
        : score >= 5
          ? "Competent with Minor Refinements"
          : "Recommended for In-Service Refresher",
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Evaluation Dimension", "Score", "Mastery", "Examiner Finding"]],
    body: metricData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: "auto" },
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(
    "2. Question-by-Question Spoken Oral Transcript & AI Evaluation",
    margin,
    currentY,
  );

  currentY += 3;

  const qTableData = rawQuestions.map((q, idx) => {
    const qText =
      q.question ||
      q.questionText ||
      `Cadre Technical In-Depth Question ${idx + 1}`;
    const diffTag = q.difficulty ? `[${q.difficulty.toUpperCase()}] ` : "";
    const spokenAns =
      q.answer ||
      q.userAnswer ||
      q.spokenAnswer ||
      (q.timeLimit
        ? "Spoken response recorded."
        : "No spoken response recorded.");
    const feedbackText =
      q.feedback || q.aiFeedback || "Demonstrated solid domain understanding.";
    const qScore =
      q.score !== undefined && q.score !== null
        ? `${q.score} / 10`
        : `${score} / 10`;

    return [
      `Q${idx + 1}`,
      `${diffTag}${qText}`,
      spokenAns,
      feedbackText,
      qScore,
    ];
  });

  if (qTableData.length === 0) {
    qTableData.push([
      "Q1",
      "Official Statistical Methods & Sampling Frameworks",
      "Demonstrated core concepts in sampling, stratification, and estimation.",
      "Good conceptual understanding demonstrated.",
      `${score} / 10`,
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "#",
        "Examiner Question",
        "Candidate Spoken Answer",
        "AI Evaluator Feedback",
        "Score",
      ],
    ],
    body: qTableData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 46 },
      2: { cellWidth: 48 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 16, halign: "center", fontStyle: "bold" },
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85],
      overflow: "linebreak",
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  applyOfficialDecorations(
    doc,
    "AI Mock Interview Scorecard",
    "Video Avatar Oral Examination & Cadre Suitability Assessment Record",
    docId,
  );

  const filename = `MoSPI_AI_Mock_Interview_${(interview?.role || "Cadre").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
};

export const generateAssignmentPDF = ({ submission, user }) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const docId = `ASGN-${(submission?._id || "sub").slice(-6).toUpperCase()}`;

  let currentY = 44;

  const aiEval = submission?.aiEvaluation || {};
  const overallMarks = aiEval.overallScore || 0;
  const grade = aiEval.grade || "A";
  const officerName = user?.name || "Statistical Officer";
  const dateStr = submission?.createdAt
    ? new Date(submission.createdAt).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");

  const cardHeight = 30;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(
    margin,
    currentY,
    pageWidth - margin * 2,
    cardHeight,
    3,
    3,
    "FD",
  );

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const titleText = `Assignment: ${submission?.assignmentTitle || "Official Statistics Case Study"}`;
  const splitTitle = doc.splitTextToSize(
    titleText,
    pageWidth - margin * 2 - 45,
  );
  doc.text(splitTitle[0], margin + 5, currentY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);

  doc.text(`Officer / Student: ${officerName}`, margin + 5, currentY + 13.5);
  doc.text(
    `Target Competency: ${submission?.targetCompetency || "Official Statistics"}`,
    margin + 72,
    currentY + 13.5,
  );
  doc.text(`Submission Date: ${dateStr}`, margin + 5, currentY + 19.5);
  doc.text(
    `Competency Delta: +${aiEval.competencyScoreDelta || 5} Index Points`,
    margin + 72,
    currentY + 19.5,
  );
  doc.text(
    "AI Model: AI Graded Case Study Assignments (SkillSetuRubric Evaluator)",
    margin + 5,
    currentY + 25.5,
  );

  const badgeX = pageWidth - margin - 34;
  const badgeW = 30;
  const badgeH = 22;
  const badgeCenterX = badgeX + badgeW / 2;

  doc.setFillColor(217, 119, 6);
  doc.roundedRect(badgeX, currentY + 4, badgeW, badgeH, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("TOTAL MARKS", badgeCenterX, currentY + 9.5, { align: "center" });

  doc.setFontSize(11);
  doc.text(`${overallMarks} / 100`, badgeCenterX, currentY + 16, {
    align: "center",
  });

  doc.setFontSize(6.5);
  doc.text(`Grade: ${grade}`, badgeCenterX, currentY + 22, { align: "center" });

  currentY += cardHeight + 6;

  doc.setTextColor(180, 83, 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("1. Official 4-Criterion Rubric Scorecard", margin, currentY);

  currentY += 3;

  const rubricScores = aiEval.rubricScores || [
    {
      criterion: "Methodological Rigor & Sampling Accuracy",
      score: 23,
      maxScore: 25,
      feedback: "Sound mathematical derivations and strata allocation.",
    },
    {
      criterion: "NQAF Compliance & Official Standard Adherence",
      score: 22,
      maxScore: 25,
      feedback:
        "Well aligned with MoSPI / UN-NQAF standard operating procedures.",
    },
    {
      criterion: "Analytical Precision & Formulas",
      score: 21,
      maxScore: 25,
      feedback:
        "Multipliers and weighting derivations are systematically demonstrated.",
    },
    {
      criterion: "Policy Insight & Practical Implementation",
      score: 22,
      maxScore: 25,
      feedback: "Actionable recommendations for survey field operations.",
    },
  ];

  const rubricTableData = rubricScores.map((r) => [
    r.criterion,
    `${r.score} / ${r.maxScore || 25}`,
    `${Math.round((r.score / (r.maxScore || 25)) * 100)}%`,
    r.feedback || "Demonstrated solid technical competence.",
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Rubric Dimension", "Score", "Mastery", "AI Examiner Feedback"]],
    body: rubricTableData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: "auto" },
    },
    headStyles: {
      fillColor: [180, 83, 9],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      overflow: "linebreak",
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [254, 243, 199],
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("2. Evaluator Insights & Actionable Feedback", margin, currentY);

  currentY += 3;

  const strengths = aiEval.strengths || [
    "Methodologically robust formulation of second-stage stratification.",
  ];
  const weaknesses = aiEval.improvementAreas || [
    "Provide explicit steps for winsorization of extreme values.",
  ];

  const insightData = [
    ["Identified Strengths", strengths.join("\n• ")],
    ["Improvement Areas", weaknesses.join("\n• ")],
    [
      "Evaluator Summary",
      aiEval.detailedFeedback ||
        "The submission satisfies the rigorous standards required of official statistics officers.",
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Evaluation Focus", "Official Feedback & Guidance"]],
    body: insightData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      overflow: "linebreak",
      cellPadding: 2.5,
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  if (submission?.submissionText) {
    const cleanSubText =
      submission.submissionText.substring(0, 1500) +
      (submission.submissionText.length > 1500 ? "..." : "");

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [["3. Candidate Submitted Practicum Solution Excerpt"]],
      body: [[cleanSubText]],
      theme: "grid",
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [71, 85, 105],
        fillColor: [248, 250, 252],
        overflow: "linebreak",
        cellPadding: 3,
      },
      margin: { top: 30, bottom: 18, left: margin, right: margin },
    });
  }

  applyOfficialDecorations(
    doc,
    "AI Graded Case Study Assignments Evaluation Dossier",
    "Operational Statistical Problem Solving & Rubric Assessment Record",
    docId,
  );

  const filename = `MoSPI_AI_Graded_Case_Study_Assignments_${(submission?.assignmentTitle || "CaseStudy").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
};

export const generateQuizPDF = ({ attempt, user }) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const docId = `QUIZ-${(attempt?._id || "attempt").slice(-6).toUpperCase()}`;

  let currentY = 44;

  const score = attempt?.score || 0;
  const accuracy =
    attempt?.accuracy ||
    Math.round((attempt?.correctCount / (attempt?.totalQuestions || 1)) * 100);
  const correctCount = attempt?.correctCount || 0;
  const totalQuestions = attempt?.totalQuestions || 0;
  const passed = attempt?.passed !== undefined ? attempt.passed : score >= 60;
  const candidateName = user?.name || "Statistical Officer Candidate";
  const dateStr = attempt?.createdAt
    ? new Date(attempt.createdAt).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");

  const cardHeight = 30;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(
    margin,
    currentY,
    pageWidth - margin * 2,
    cardHeight,
    3,
    3,
    "FD",
  );

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const examTitle = `Examination: ${attempt?.quizTitle || attempt?.topic || "Diagnostic Assessment Test"}`;
  const splitTitle = doc.splitTextToSize(
    examTitle,
    pageWidth - margin * 2 - 45,
  );
  doc.text(splitTitle[0], margin + 5, currentY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);

  doc.text(`Candidate: ${candidateName}`, margin + 5, currentY + 13.5);
  doc.text(
    `Domain: ${attempt?.domain || "Official Statistics"}`,
    margin + 72,
    currentY + 13.5,
  );
  doc.text(`Exam Date: ${dateStr}`, margin + 5, currentY + 19.5);
  doc.text(
    `Difficulty: ${attempt?.difficulty || "Medium"}`,
    margin + 72,
    currentY + 19.5,
  );
  doc.text(
    `AI Model: AI Quiz & Test (Adaptive Diagnostic)`,
    margin + 5,
    currentY + 25.5,
  );
  doc.text(
    `Score: ${correctCount} / ${totalQuestions} Correct (${accuracy}% Accuracy)`,
    margin + 72,
    currentY + 25.5,
  );

  const badgeX = pageWidth - margin - 34;
  const badgeW = 30;
  const badgeH = 22;
  const badgeCenterX = badgeX + badgeW / 2;

  doc.setFillColor(passed ? 16 : 225, passed ? 185 : 29, passed ? 129 : 72);
  doc.roundedRect(badgeX, currentY + 4, badgeW, badgeH, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("EXAM SCORE", badgeCenterX, currentY + 9.5, { align: "center" });

  doc.setFontSize(11);
  doc.text(`${score}%`, badgeCenterX, currentY + 16, { align: "center" });

  doc.setFontSize(6.5);
  doc.text(passed ? "PASSED" : "NEEDS REVIEW", badgeCenterX, currentY + 22, {
    align: "center",
  });

  currentY += cardHeight + 6;

  doc.setTextColor(13, 148, 136);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("1. Topic Mastery & Diagnostic Breakdown", margin, currentY);

  currentY += 3;

  const topicAnalysis = attempt?.topicAnalysis || [
    {
      topic: attempt?.topic || "Core Principles",
      score: score,
      status: passed ? "Mastered" : "Needs Review",
    },
  ];

  const topicData = topicAnalysis.map((t) => [
    t.topic,
    `${t.score || score}%`,
    t.status || (passed ? "Mastered" : "Needs Review"),
    t.status === "Mastered" || passed
      ? "Strong concept retention"
      : "Recommend reviewing NSSTA module",
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Sub-Topic Area",
        "Score",
        "Mastery Status",
        "Pedagogical Recommendation",
      ],
    ],
    body: topicData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: "auto" },
    },
    headStyles: {
      fillColor: [13, 148, 136],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [240, 253, 250],
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("2. Question-by-Question Performance Review", margin, currentY);

  currentY += 3;

  const userAnswers = attempt?.userAnswers || [];
  const qTableData = userAnswers.map((q, idx) => [
    `Q${idx + 1}`,
    q.questionText || `Question ${idx + 1}`,
    q.selectedOption || "Not Answered",
    q.correctAnswer || "-",
    q.isCorrect ? "CORRECT" : "INCORRECT",
    q.explanation || "Official NSSTA statistical guidance.",
  ]);

  if (qTableData.length === 0) {
    qTableData.push([
      "Q1",
      attempt?.topic || "Core Question",
      "Option A",
      "Option A",
      "CORRECT",
      "Verified concept.",
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "#",
        "Diagnostic Question",
        "Your Answer",
        "Correct",
        "Result",
        "Pedagogical Explanation",
      ],
    ],
    body: qTableData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 42 },
      2: { cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { cellWidth: 20, halign: "center", fontStyle: "bold" },
      5: { cellWidth: "auto" },
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85],
      overflow: "linebreak",
      cellPadding: 2.2,
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        if (data.cell.raw === "CORRECT") {
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  applyOfficialDecorations(
    doc,
    "AI Quiz & Test Diagnostic Examination Dossier",
    "Timed Knowledge Assessment & Objective Competency Validation Record",
    docId,
  );

  const filename = `MoSPI_AI_Quiz_and_Test_${(attempt?.quizTitle || attempt?.topic || "Quiz").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
};

export const generateCompetencyPDF = ({
  user,
  profile,
  competencies = [],
  skillGaps = [],
  learningPath = [],
}) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const docId = `SKILL-${Date.now().toString().slice(-6)}`;

  let currentY = 44;

  const overallScore =
    profile?.overallCompetencyScore || user?.overallCompetencyScore || 68;
  const officerName = profile?.name || user?.name || "Statistical Officer";

  const cardHeight = 30;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(
    margin,
    currentY,
    pageWidth - margin * 2,
    cardHeight,
    3,
    3,
    "FD",
  );

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const profileText = `Officer Profile: ${officerName}`;
  const splitProfile = doc.splitTextToSize(
    profileText,
    pageWidth - margin * 2 - 45,
  );
  doc.text(splitProfile[0], margin + 5, currentY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);

  doc.text(
    `Cadre Role: ${profile?.jobRole || user?.jobRole || "ISS Officer"}`,
    margin + 5,
    currentY + 13.5,
  );
  doc.text(
    `Department: ${profile?.department || user?.department || "NSSO / MoSPI"}`,
    margin + 72,
    currentY + 13.5,
  );
  doc.text(
    `Experience: ${profile?.workExperience || "3+ Years"}`,
    margin + 5,
    currentY + 19.5,
  );
  doc.text(
    `Assessed Competencies: ${competencies.length} Areas`,
    margin + 72,
    currentY + 19.5,
  );
  doc.text(
    `AI Analysis: Multi-Domain Competency Assessment`,
    margin + 5,
    currentY + 25.5,
  );

  doc.text(
    `Recommended Pathway: ${learningPath.length} Learning models`,
    margin + 72,
    currentY + 25.5,
  );

  const badgeX = pageWidth - margin - 34;
  const badgeW = 30;
  const badgeH = 22;
  const badgeCenterX = badgeX + badgeW / 2;

  doc.setFillColor(30, 58, 138);
  doc.roundedRect(badgeX, currentY + 4, badgeW, badgeH, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("OVERALL INDEX", badgeCenterX, currentY + 9.5, { align: "center" });

  doc.setFontSize(11);
  doc.text(`${overallScore}%`, badgeCenterX, currentY + 16, {
    align: "center",
  });

  doc.setFontSize(6.5);
  doc.text("COMPETENCY", badgeCenterX, currentY + 22, { align: "center" });

  currentY += cardHeight + 6;

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(
    "1. Learner Performance & Cadre Benchmarking Matrix",
    margin,
    currentY,
  );

  currentY += 3;

  const compTableData = (
    competencies.length > 0
      ? competencies
      : [
          {
            competencyName: "Sampling Techniques & Estimation",
            domain: "Statistical",
            score: 45,
            level: "Beginner",
          },
          {
            competencyName: "National Accounts (SNA 2008)",
            domain: "Statistical",
            score: 80,
            level: "Advanced",
          },
          {
            competencyName: "Statistical Computing & Automated Processing",
            domain: "Technical",
            score: 40,
            level: "Beginner",
          },
          {
            competencyName: "Data Privacy & DPDP Act",
            domain: "Governance",
            score: 72,
            level: "Intermediate",
          },
          {
            competencyName: "Price Statistics (CPI/WPI)",
            domain: "Statistical",
            score: 85,
            level: "Advanced",
          },
        ]
  ).map((c) => {
    const status =
      c.score >= 75
        ? "Meets Benchmark"
        : c.score >= 50
          ? "Developing"
          : "CRITICAL GAP";
    return [
      c.competencyName,
      c.domain || "Statistical",
      `${c.score}%`,
      "75%",
      `${c.score - 75 >= 0 ? "+" : ""}${c.score - 75}%`,
      status,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      ["Competency Area", "Domain", "Score", "Benchmark", "Deficit", "Status"],
    ],
    body: compTableData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: 26 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 32, halign: "center", fontStyle: "bold" },
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        if (data.cell.raw === "CRITICAL GAP") {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.raw === "Meets Benchmark") {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  doc.setTextColor(180, 83, 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(
    "2. Identified Weaknesses & Priority Action Items (AI Detected)",
    margin,
    currentY,
  );

  currentY += 3;

  const gapTableData = (
    skillGaps.length > 0
      ? skillGaps
      : [
          {
            competencyName: "Statistical Computing & Automated Processing",
            priority: "High",
            currentLevel: "Beginner",
            requiredLevel: "Advanced",
            recommendedAction:
              "Complete iGOT Automated Statistical Computing 20-Hour Module",
          },
          {
            competencyName: "Sampling Techniques & Estimation",
            priority: "High",
            currentLevel: "Intermediate",
            requiredLevel: "Advanced",
            recommendedAction: "Attend NSSTA Residential Sampling Workshop",
          },
        ]
  ).map((g) => [
    g.competencyName,
    g.priority,
    g.currentLevel,
    g.requiredLevel,
    g.recommendedAction || "Enroll in recommended iGOT module",
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Weakness / Skill Gap",
        "Priority",
        "Current",
        "Target",
        "AI Recommended Action",
      ],
    ],
    body: gapTableData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: 18, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: "auto" },
    },
    headStyles: {
      fillColor: [180, 83, 9],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      overflow: "linebreak",
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [254, 243, 199],
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        if (data.cell.raw === "High") {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  doc.setTextColor(37, 99, 235);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(
    "3. AI Generated Learning Pathway (Targeted to Bridge Weaknesses)",
    margin,
    currentY,
  );

  currentY += 3;

  const pathTableData = (
    learningPath.length > 0
      ? learningPath
      : [
          {
            title: "Automated Statistical Computing & Microdata Processing",
            provider: "iGOT Karmayogi",
            skillAddressed: "Statistical Computing",
            duration: "20 Hours",
            priority: "High",
          },
          {
            title: "Sampling Design & Estimation in Large Surveys",
            provider: "NSSTA TPAC In-Service",
            skillAddressed: "Sampling Techniques",
            duration: "2 Weeks",
            priority: "High",
          },
          {
            title: "Data Privacy & DPDP Compliance in Official Statistics",
            provider: "iGOT Karmayogi",
            skillAddressed: "Data Privacy & Ethics",
            duration: "6 Hours",
            priority: "Medium",
          },
        ]
  ).map((p, idx) => [
    `Step ${idx + 1}`,
    p.title,
    p.provider,
    p.skillAddressed,
    p.duration,
    p.priority || "High",
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Step",
        "Training Programme",
        "Provider",
        "Targeted Weakness",
        "Duration",
        "Priority",
      ],
    ],
    body: pathTableData,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 46 },
      2: { cellWidth: 32 },
      3: { cellWidth: 36 },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 18, halign: "center", fontStyle: "bold" },
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      overflow: "linebreak",
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [239, 246, 255],
    },
    margin: { top: 30, bottom: 18, left: margin, right: margin },
  });

  applyOfficialDecorations(
    doc,
    "AI Multi-Domain Competency Knowledge & Skill Gap Dossier",
    "National Statistical Systems Training Academy (NSSTA) • SkillIQ Intelligence Matrix",
    docId,
  );

  const filename = `MoSPI_AI_Multi_Domain_Competency_Knowledge_${(profile?.name || user?.name || "Officer").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
};

export const generatePortalComparisonPDF = ({ user: _user } = {}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  applyOfficialDecorations(
    doc,
    "ARCHITECTURAL COMPARISON: LEGACY VS SKILLSETU AI",
    "Comparative Audit & Operational Differentiators",
    "SKILLSETU-COMP-2026",
  );

  let currentY = 46;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138);
  doc.text("EXECUTIVE COMPARATIVE ARCHITECTURE AUDIT", margin, currentY);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const summaryText =
    "This comparative dossier outlines the transformative differences between legacy government training portals / generic LMS and the SkillSetu AI-Enabled Skill Intelligence Platform engineered for official statistical workforce competency.";
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
  doc.text(splitSummary, margin, currentY);
  currentY += splitSummary.length * 4.5 + 4;

  const comparisonData = [
    [
      "Cadre Competency Mapping",
      "Generic non-cadre catalogs, one-size-fits-all",
      "4-Domain Competency Framework across statistical disciplines",
      "+100% Cadre Specificity",
    ],
    [
      "Skill Gap Diagnostics",
      "Subjective annual reviews, no automated gap metric",
      "SkillSetu AI Neural Engine real-time gap calculation (<75%)",
      "Instant Gap Remediation",
    ],
    [
      "Adaptive Learning Pathways",
      "Passive video catalogs with manual keyword search",
      "AI-curated sequential digital & in-service roadmaps",
      "95% Faster Skill Mastery",
    ],
    [
      "Oral Viva Voce & Interview",
      "Non-existent; requires manual in-person boards",
      "Real-time voice speech-to-text oral examination with Gemini AI",
      "Continuous Board Prep",
    ],
    [
      "Training Manual MCQ Studio",
      "Months of manual committee authoring",
      "Upload survey manuals (PDF/TXT) to author MCQs in 30 seconds",
      "Instant Syllabus Updates",
    ],
    [
      "Official Performance Dossier",
      "Basic unverified attendance certificate",
      "Verifiable competency dossier with QR and authenticity code",
      "Career Progression Record",
    ],
    [
      "24/7 Contextual Assistant",
      "Static FAQ page or email helpdesk",
      "SkillSetu Copilot AI trained in official statistical methodologies",
      "Instant Methodology Guidance",
    ],
    [
      "Executive Oversight & Chat",
      "Delayed quarterly spreadsheets, fragmented records",
      "Live heatmaps, material dispatch, and real-time officer support chat",
      "100% Real-Time Visibility",
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Capability / Dimension",
        "Legacy Government Portals",
        "SkillSetu AI Platform",
        "Strategic Impact",
      ],
    ],
    body: comparisonData,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
      valign: "middle",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { textColor: [185, 28, 28], cellWidth: 50 },
      2: { textColor: [21, 128, 61], fontStyle: "bold", cellWidth: 58 },
      3: {
        textColor: [30, 58, 138],
        fontStyle: "bold",
        halign: "center",
        cellWidth: 36,
      },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  if (finalY < 265) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text("VERIFICATION & COMPLIANCE SEAL", margin, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Validated by SkillSetu AI Engine • Aligned with UN-NQAF & Digital Personal Data Protection (DPDP) Act 2023.",
      margin,
      finalY + 5,
    );
  }

  doc.save("SkillSetu_AI_Platform_Architecture_Comparison.pdf");
};

export const generateModelHistoryPDF = ({
  type,
  record,
  user,
  extraData: _extraData = {},
}) => {
  switch (type) {
    case "chat":
      return generateChatPDF({ chat: record, user });
    case "interview":
      return generateInterviewPDF({ interview: record, user });
    case "assignment":
      return generateAssignmentPDF({ submission: record, user });
    case "quiz":
      return generateQuizPDF({ attempt: record, user });
    case "competency":
      return generateCompetencyPDF({
        user,
        profile: user,
        competencies: record?.competencies || user?.competencies || [],
        skillGaps: record?.skillGaps || user?.skillGaps || [],
        learningPath: record?.learningPath || user?.learningPath || [],
      });
    case "comparison":
      return generatePortalComparisonPDF({ user });
    default:
      console.warn("Unknown PDF type:", type);
      return generateChatPDF({ chat: record, user });
  }
};

export default {
  generateChatPDF,
  generateInterviewPDF,
  generateAssignmentPDF,
  generateQuizPDF,
  generateCompetencyPDF,
  generateModelHistoryPDF,
  generatePortalComparisonPDF,
};
