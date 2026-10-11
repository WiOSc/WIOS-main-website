/** Use after authenticate(): lets the request through only if req.user has the role. */
export const requireRole = (role) => (req, res, next) =>
  req.user?.role === role ? next() : res.status(403).json({ error: `Requires ${role} role` });
