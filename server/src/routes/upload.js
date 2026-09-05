import { Router } from "express";
import multer from "multer";
import { extractText } from "../textExtract.js";
import { chunkText, buildIndex } from "../rag.js";
import { requireSession } from "../store.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const router = Router();

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const session = requireSession(sessionId);

    const text = await extractText(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!text || text.trim().length < 20) {
      return res
        .status(422)
        .json({ error: "Could not extract usable text from this file." });
    }

    const chunks = chunkText(text);
    const indexed = buildIndex(chunks);

    session.material.fileName = req.file.originalname;
    session.material.chunks = indexed;

    res.json({
      fileName: req.file.originalname,
      chunkCount: indexed.length,
      preview: text.slice(0, 400),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
