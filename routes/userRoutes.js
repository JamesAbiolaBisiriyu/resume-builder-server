// File Purpose: Route definitions for user authentication, verification, and resume listing endpoints.
import express from 'express';
import {
  loginUser,
  registerUser,
  getUserById,
  getUserResumes,
  verifyEmail,
  resendVerification,
} from '../controllers/userController.js';
import protect from '../middlewares/authMiddleware.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/verify-email', verifyEmail);
userRouter.post('/resend-verification', resendVerification);
userRouter.get('/data', protect, getUserById);
userRouter.get('/resumes', protect, getUserResumes);

export default userRouter;