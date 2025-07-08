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
  getMentorSessions,
  getMenteeSessions,
  getSentRequests,
  getUserById,
  addMentorComment,
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
// User profile by ID
router.get('/users/:id', verifyToken, getUserById);

//  Mentor discovery
router.get('/mentors', getAllMentors);
router.get('/mentors/filter', getFilteredMentors);
router.get('/mentors/:id', getMentorById);

//Additional session routes
router.get('/sessions/mentor', verifyToken, getMentorSessions);
router.get('/sessions/mentee', verifyToken, getMenteeSessions);


//  Session requests
router.post('/request-session', verifyToken, requestSession);
router.get('/mentor/requests', verifyToken, getMentorRequests);
router.patch('/mentor/requests/:id', verifyToken, respondToRequest);
router.get('/requests/sent', verifyToken, getSentRequests);
router.post('/sessions/:id/comment', verifyToken, addMentorComment);

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
