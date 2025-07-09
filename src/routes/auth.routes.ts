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
router.put('/users/me/profile', verifyToken, updateProfile);
router.get('/users/me', verifyToken, getUserProfile);

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
router.post('/request', verifyToken, requestSession);
router.get('/requests/received', verifyToken, getMentorRequests);
router.put('/requests/:id', verifyToken, respondToRequest);
router.get('/requests/sent', verifyToken, getSentRequests);
router.post('/sessions/:id/comment', verifyToken, addMentorComment);

//  Availability
router.post('/mentor/availability', verifyToken, setAvailability);

//  Feedback
router.put('/sessions/:id/feedback', verifyToken, submitFeedback);

//  Admin endpoints
router.get('/admin/users', verifyToken, getAllUsers);
router.put('/admin/users/:id/role', verifyToken, updateUserRole);
router.delete('/admin/users/:id', verifyToken, deleteUser);

// Admin Routes
router.get('/admin/matches', verifyToken, getAllMatches);
router.get('/admin/session-stats', verifyToken, getSessionStats);
router.post('/admin/assign-match', verifyToken, assignMentor);


export default router;
