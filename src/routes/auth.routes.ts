import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllMentors,
  requestSession,
  getMentorRequests,
  respondToRequest,
  getAllUsers,
  updateUserRole,
  deleteUser,
  submitFeedback,
  getFilteredMentors,
  getMentorById,
  updateProfile,
  setAvailability,
  getAllMatches,       
  getSessionStats,     
  assignMentor 
} from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

//  Authentication
router.post('/register', registerUser);
router.post('/login', loginUser);

//  Profile
router.get('/me', verifyToken, getUserProfile);
router.put('/users/me/profile', verifyToken, updateProfile);

//  Mentor discovery
router.get('/mentors', getAllMentors);
router.get('/mentors/filter', getFilteredMentors);
router.get('/mentors/:id', getMentorById);

//  Session requests
router.post('/request-session', verifyToken, requestSession);
router.get('/mentor/requests', verifyToken, getMentorRequests);
router.patch('/mentor/requests/:id', verifyToken, respondToRequest);

//  Availability
router.post('/mentor/availability', verifyToken, setAvailability);

//  Feedback
router.post('/sessions/:id/feedback', verifyToken, submitFeedback);

//  Admin endpoints
router.get('/admin/users', verifyToken, getAllUsers);
router.patch('/admin/users/:id/role', verifyToken, updateUserRole);
router.delete('/admin/users/:id', verifyToken, deleteUser);

// Admin Routes
router.get('/admin/matches', verifyToken, getAllMatches);
router.get('/admin/session-stats', verifyToken, getSessionStats);
router.post('/admin/assign-match', verifyToken, assignMentor);


export default router;
