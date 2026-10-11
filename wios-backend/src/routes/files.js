import { Router } from "express";
import { listFiles } from "../services/fileStore.js";

const router = Router();

// GET /api/files -> any signed-in user (admin or user) can see uploaded files
router.get("/", async (_req, res, next) => {
  try {
    res.json({ files: await listFiles() });
  } catch (err) {
    next(err);
  }
});

export default router;
