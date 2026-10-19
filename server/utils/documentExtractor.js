import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import AdmZip from "adm-zip";

const stripXmlTags = (xmlString = "") => {
  if (!xmlString || typeof xmlString !== "string") return "";
  return xmlString
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

export const extractPdfText = async (buffer) => {
  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => (item.str ? item.str.trim() : ""))
        .filter(Boolean)
        .join(" ");

      if (pageText.trim()) {
        pageTexts.push(
          `--- Page ${pageNum} of ${pdf.numPages} ---\n${pageText}`,
        );
      }
    }

    return pageTexts.join("\n\n").trim();
  } catch (err) {
    console.error("[PDF EXTRACTION ERROR]", err.message);
    return "";
  }
};

export const extractPptxText = async (buffer) => {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const slides = [];
    const notes = {};

    zipEntries.forEach((entry) => {
      const match = entry.entryName.match(
        /ppt\/notesSlides\/notesSlide(\d+)\.xml/i,
      );
      if (match) {
        const noteNum = parseInt(match[1], 10);
        const xml = entry.getData().toString("utf-8");
        const text = stripXmlTags(xml);
        if (text) {
          notes[noteNum] = text;
        }
      }
    });

    zipEntries.forEach((entry) => {
      const match = entry.entryName.match(/ppt\/slides\/slide(\d+)\.xml/i);
      if (match) {
        const slideNum = parseInt(match[1], 10);
        const xml = entry.getData().toString("utf-8");

        const textMatches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
        const slideText = textMatches
          .map((m) => stripXmlTags(m))
          .filter(Boolean)
          .join(" ");

        const fullSlideText = slideText || stripXmlTags(xml);
        if (fullSlideText) {
          slides.push({
            num: slideNum,
            text: fullSlideText,
            note: notes[slideNum] || "",
          });
        }
      }
    });

    slides.sort((a, b) => a.num - b.num);

    if (slides.length === 0) {
      let fallbackText = "";
      zipEntries.forEach((entry) => {
        if (
          entry.entryName.startsWith("ppt/") &&
          entry.entryName.endsWith(".xml")
        ) {
          const xml = entry.getData().toString("utf-8");
          const text = stripXmlTags(xml);
          if (text && text.length > 10) {
            fallbackText += `\n${text}`;
          }
        }
      });
      return fallbackText.trim();
    }

    const formattedSlides = slides.map((s) => {
      let out = `--- Slide ${s.num} ---\n${s.text}`;
      if (s.note) {
        out += `\n[Speaker Notes: ${s.note}]`;
      }
      return out;
    });

    return formattedSlides.join("\n\n").trim();
  } catch (err) {
    console.error("[PPTX EXTRACTION ERROR]", err.message);
    return "";
  }
};

export const extractDocxText = async (buffer) => {
  try {
    const zip = new AdmZip(buffer);
    const docEntry = zip.getEntry("word/document.xml");
    if (!docEntry) return "";

    const xml = docEntry.getData().toString("utf-8");
    const paragraphs = xml
      .split(/<\/w:p>/gi)
      .map((pXml) => {
        const tMatches = pXml.match(/<w:t[^>]*>(.*?)<\/w:t>/gi) || [];
        return tMatches.map((m) => stripXmlTags(m)).join("");
      })
      .filter((p) => p.trim().length > 0);

    return paragraphs.join("\n\n").trim();
  } catch (err) {
    console.error("[DOCX EXTRACTION ERROR]", err.message);
    return "";
  }
};

export const extractOdfText = async (buffer) => {
  try {
    const zip = new AdmZip(buffer);
    const contentEntry = zip.getEntry("content.xml");
    if (!contentEntry) return "";

    const xml = contentEntry.getData().toString("utf-8");
    return stripXmlTags(xml);
  } catch (err) {
    console.error("[ODF EXTRACTION ERROR]", err.message);
    return "";
  }
};

export const extractBinaryStrings = (buffer) => {
  try {
    const str = buffer.toString("binary");
    const matches = str.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    return matches
      .map((s) => s.trim())
      .filter((s) => s.length > 5 && !/^[0-9a-fA-F]{8,}$/.test(s))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    return "";
  }
};

export const extractTextFromFile = async (
  fileBuffer,
  originalName = "",
  mimeType = "",
) => {
  const ext = originalName.split(".").pop().toLowerCase();
  let extractedText = "";

  try {
    if (ext === "pdf" || mimeType === "application/pdf") {
      extractedText = await extractPdfText(fileBuffer);
    } else if (ext === "pptx" || mimeType.includes("presentationml")) {
      extractedText = await extractPptxText(fileBuffer);
    } else if (ext === "docx" || mimeType.includes("wordprocessingml")) {
      extractedText = await extractDocxText(fileBuffer);
    } else if (
      ["odp", "odt"].includes(ext) ||
      mimeType.includes("opendocument")
    ) {
      extractedText = await extractOdfText(fileBuffer);
    } else if (
      [
        "txt",
        "csv",
        "tsv",
        "md",
        "markdown",
        "json",
        "rtf",
        "html",
        "xml",
        "log",
        "yaml",
        "yml",
      ].includes(ext) ||
      mimeType.startsWith("text/")
    ) {
      extractedText = fileBuffer.toString("utf-8");
      if (ext === "html") {
        extractedText = stripXmlTags(extractedText);
      }
    } else if (ext === "ppt") {
      extractedText = await extractPptxText(fileBuffer);
      if (!extractedText || extractedText.length < 50) {
        extractedText = extractBinaryStrings(fileBuffer);
      }
    } else if (ext === "doc") {
      extractedText = await extractDocxText(fileBuffer);
      if (!extractedText || extractedText.length < 50) {
        extractedText = extractBinaryStrings(fileBuffer);
      }
    } else if (
      ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp"].includes(ext) ||
      mimeType.startsWith("image/")
    ) {
      extractedText = `[Image/Chart Document: ${originalName}] Visual statistical diagram, infographic, or survey chart.`;
    } else {
      extractedText = extractBinaryStrings(fileBuffer);
    }
  } catch (err) {
    console.error(`[UNIVERSAL EXTRACTOR ERROR for ${originalName}]`, err);
  }

  return (extractedText || "").replace(/\r\n/g, "\n").trim();
};

export default {
  extractPdfText,
  extractPptxText,
  extractDocxText,
  extractOdfText,
  extractTextFromFile,
};
