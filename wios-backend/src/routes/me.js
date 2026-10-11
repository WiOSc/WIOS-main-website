import { Router } from "express";

const router = Router();

// GET /api/me -> who am I and what can I do?
router.get("/", (req, res) => {
  const { email, role } = req.user;
  res.json({ email, role, canUpload: role === "admin" });
});

export default router;
