function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

module.exports = { authorize };
