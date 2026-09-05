import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

/**
 * Extract plain text from an uploaded file buffer based on its mimetype/name.
 */
export async function extractText(buffer, originalName, mimetype) {
  const lower = (originalName || "").toLowerCase();

  if (mimetype === "application/pdf" || lower.endsWith(".pdf")) {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimetype?.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  throw Object.assign(
    new Error(
      "Unsupported file type. Please upload a PDF, DOCX, or plain text (.txt/.md) file."
    ),
    { status: 415 }
  );
}
