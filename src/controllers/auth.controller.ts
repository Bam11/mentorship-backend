import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

//  Register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, bio, skills, goals, industry } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        bio,
        skills,
        goals,
        industry,
      },
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error: any) {
    console.error("Registration Error:", error.message || error);
    res.status(500).json({ message: 'Registration failed' });
  }
};


// Login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
};


// Get logged-in user profile
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        skills: true,
        goals: true,
        industry: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};


// Update profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { bio, skills, goals, industry } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { bio, skills, goals, industry },
      select: {
        id: true, name: true, email: true, role: true, bio: true,
        skills: true, goals: true, industry: true
      },
    });

    res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

//Get another user profile by id
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        skills: true,
        goals: true,
        industry: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Get all mentors
export const getAllMentors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: 'MENTOR' },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        skills: true,
        goals: true,
        industry: true,
      },
    });

    res.json({ mentors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch mentors' });
  }
};


//  Get filtered mentors (by skill, industry)
export const getFilteredMentors = async (req: Request, res: Response): Promise<void> => {
  try {
    const skill = req.query.skill as string;
    const industry = req.query.industry as string;

    const mentors = await prisma.user.findMany({
      where: {
        role: 'MENTOR',
        ...(skill && { skills: { has: skill } }),
        ...(industry && { industry: { equals: industry, mode: 'insensitive' } })
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        skills: true,
        goals: true,
        industry: true
      }
    });

    res.json({ mentors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to filter mentors' });
  }
};

//  Get mentor by ID
export const getMentorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mentor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        skills: true,
        goals: true,
        industry: true,
        role: true,
      },
    });

    if (!mentor || mentor.role !== 'MENTOR') {
      res.status(404).json({ message: 'Mentor not found' });
      return;
    }

    res.status(200).json({ mentor });
  } catch (error) {
    console.error('Get mentor error:', error);
    res.status(500).json({ message: 'Failed to fetch mentor profile' });
  }
};

//  Mentee requests session
export const requestSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mentorId, topic } = req.body;
    const menteeId = req.user?.userId;

    if (!mentorId || !topic) {
      res.status(400).json({ message: 'Mentor ID and topic are required' });
      return;
    }

    const session = await prisma.sessionRequest.create({
      data: {
        mentorId,
        menteeId,
        topic,
      },
    });

    res.status(201).json({ message: 'Session request sent', session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send request' });
  }
};

// Mentor views incoming requests
export const getMentorRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'MENTOR') {
      res.status(403).json({ message: 'Access denied. Mentors only.' });
      return;
    }

    const mentorId = req.user.userId;

    const requests = await prisma.sessionRequest.findMany({
      where: { mentorId },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            skills: true,
            goals: true,
          },
        },
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch session requests' });
  }
};

// Mentor responds to session request (accept/reject)
export const respondToRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user?.role !== 'MENTOR') {
      res.status(403).json({ message: 'Mentors only' });
      return;
    }

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Status must be accepted or rejected' });
      return;
    }

    const request = await prisma.sessionRequest.findUnique({ where: { id } });
    if (!request || request.mentorId !== req.user.userId) {
      res.status(404).json({ message: 'Session not found or unauthorized' });
      return;
    }

    const updated = await prisma.sessionRequest.update({
      where: { id },
      data: { status },
    });

    res.json({ message: `Session ${status}`, request: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update session status' });
  }
};

//  Mentor sets availability
export const setAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mentorId = req.user?.userId;
    const { day, startTime, endTime } = req.body;

    if (req.user?.role !== 'MENTOR') {
      res.status(403).json({ message: 'Only mentors can set availability' });
      return;
    }

    const newSlot = await prisma.availability.create({
      data: {
        mentorId,
        day,
        startTime,
        endTime,
      },
    });

    res.status(201).json({ message: 'Availability set', slot: newSlot });
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({ message: 'Failed to set availability' });
  }
};

//  Mentee submits feedback and rating
export const submitFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback, rating } = req.body;

    if (req.user?.role !== 'MENTEE') {
      res.status(403).json({ message: 'Only mentees can submit feedback' });
      return;
    }

    if (!feedback || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Feedback and rating (1–5) are required' });
      return;
    }

    const session = await prisma.sessionRequest.findUnique({ where: { id } });
    if (!session || session.menteeId !== req.user.userId) {
      res.status(404).json({ message: 'Session not found or unauthorized' });
      return;
    }

    const updated = await prisma.sessionRequest.update({
      where: { id },
      data: { feedback, rating },
    });

    res.json({ message: 'Feedback submitted', session: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

export const getSentRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'MENTEE') {
      res.status(403).json({ message: 'Only mentees can view sent requests' });
      return;
    }

    const requests = await prisma.sessionRequest.findMany({
      where: { menteeId: req.user.userId },
      include: {
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Sent requests error:', error);
    res.status(500).json({ message: 'Failed to fetch sent requests' });
  }
};

// Get all sessions for the mentee
export const getMenteeSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'MENTEE') {
      res.status(403).json({ message: 'Only mentees can view this' });
      return;
    }

    const sessions = await prisma.sessionRequest.findMany({
      where: {
        menteeId: req.user.userId,
        status: 'accepted',
      },
      include: {
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Mentee sessions error:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
};

// Get all sessions for the mentor
export const getMentorSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'MENTOR') {
      res.status(403).json({ message: 'Only mentors can view this' });
      return;
    }

    const sessions = await prisma.sessionRequest.findMany({
      where: {
        mentorId: req.user.userId,
        status: 'accepted',
      },
      include: {
        mentee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Mentor sessions error:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
};


// Mentor adds comment after session
export const addMentorComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { mentorComment } = req.body;

    if (req.user?.role !== 'MENTOR') {
      res.status(403).json({ message: 'Only mentors can comment' });
      return;
    }

    const session = await prisma.sessionRequest.findUnique({ where: { id } });
    if (!session || session.mentorId !== req.user.userId) {
      res.status(404).json({ message: 'Session not found or unauthorized' });
      return;
    }

    const updated = await prisma.sessionRequest.update({
      where: { id },
      data: { mentorComment },
    });

    res.json({ message: 'Comment submitted', session: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

// Admin: view all users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admins only' });
      return;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        skills: true,
        goals: true,
        industry: true,
        createdAt: true,
      },
    });

    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Admin: update user role
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admins only' });
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MENTOR', 'MENTEE'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.json({ message: 'User role updated', user: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update role' });
  }
};

//  Admin: delete user
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admins only' });
      return;
    }

    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Admin views accepted matches
export const getAllMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admins only' });
      return;
    }

    const matches = await prisma.sessionRequest.findMany({
      where: { status: 'accepted' },
      include: {
        mentor: {
          select: { id: true, name: true, email: true },
        },
        mentee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({ matches });
  } catch (error) {
    console.error('Admin get matches error:', error);
    res.status(500).json({ message: 'Failed to fetch matches' });
  }
};

// Admin sees session stats (total sessions)
export const getSessionStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admins only' });
      return;
    }

    const total = await prisma.sessionRequest.count();
    const accepted = await prisma.sessionRequest.count({ where: { status: 'accepted' } });
    const rejected = await prisma.sessionRequest.count({ where: { status: 'rejected' } });
    const pending = await prisma.sessionRequest.count({ where: { status: 'pending' } });

    res.json({ total, accepted, rejected, pending });
  } catch (error) {
    console.error('Admin session stats error:', error);
    res.status(500).json({ message: 'Failed to fetch session stats' });
  }
};


// Admin assigns mentor to mentee manually
export const assignMentor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admins only' });
      return;
    }

    const { mentorId, menteeId, topic } = req.body;

    if (!mentorId || !menteeId || !topic) {
      res.status(400).json({ message: 'mentorId, menteeId, and topic are required' });
      return;
    }

    const session = await prisma.sessionRequest.create({
      data: {
        mentorId,
        menteeId,
        topic,
        status: 'accepted',
      },
    });

    res.status(201).json({ message: 'Mentor assigned successfully', session });
  } catch (error) {
    console.error('Assign mentor error:', error);
    res.status(500).json({ message: 'Failed to assign mentor' });
  }
};



