import { Router } from "express";
import { ROLES, httpError, listUsers, setRole, syncFromAuth } from "../services/userStore.js";

const router = Router(); // mounted behind authenticate + requireRole("admin")

// GET /api/admin/users -> everyone and their role.
// First pulls in anyone added in Firebase Authentication who has no record yet.
router.get("/", async (_req, res, next) => {
  try {
    await syncFromAuth();
    res.json({ users: await listUsers() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:email/role   body: { "role": "admin" | "user" }
router.put("/:email/role", async (req, res, next) => {
  try {
    const { role } = req.body ?? {};
    if (!ROLES.includes(role)) throw httpError(400, `role must be one of: ${ROLES.join(", ")}`);
    res.json(await setRole(req.params.email, role, req.user.email));
  } catch (err) {
    next(err);
  }
});

export default router;
