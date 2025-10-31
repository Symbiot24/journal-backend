import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const jwtAuthMiddleware = async (req, res, next) => {
  
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Format: "Bearer token"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Malformed token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Enforce inactivity timeout of 3 days
    const userId = decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(userId).select('_id lastActivityAt');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const now = Date.now();
    const lastActivity = user.lastActivityAt ? new Date(user.lastActivityAt).getTime() : 0;
    const INACTIVITY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

    if (now - lastActivity > INACTIVITY_WINDOW_MS) {
      return res.status(401).json({ message: 'Session expired due to inactivity' });
    }

    // Update activity timestamp
    await User.updateOne({ _id: user._id }, { $set: { lastActivityAt: new Date(now) } });

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const generateToken = (userData) =>{
  return jwt.sign(userData, process.env.JWT_SECRET_KEY, { expiresIn: '14d' });
}

export {jwtAuthMiddleware, generateToken};