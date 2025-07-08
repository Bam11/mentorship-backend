import express from 'express';
import { verifyToken,AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Just a protected test route (optional)
router.get('/', verifyToken, (req: AuthRequest,res) => {
  res.json({
    message: 'Access granted to protected route',
    user: req.user
  });
});

export default router;
