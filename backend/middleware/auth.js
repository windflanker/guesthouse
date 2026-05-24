import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
