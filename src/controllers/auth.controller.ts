import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

//  Register
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, bio, skills, goals, industry } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

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

    return res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error: any) {
    console.error("Registration Error:", error.message || error);
    return res.status(500).json({ message: 'Registration failed' });
  }
};

// Login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '1d',
    });

    return res.status(200).json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

// Get logged-in user profile
export const getUserProfile = async (req: AuthRequest, res: Response) => {
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

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// Update profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
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

    return res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Get all mentors
export const getAllMentors = async (_req: Request, res: Response) => {
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

    return res.json({ mentors });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch mentors' });
  }
};

//  Get filtered mentors (by skill, industry)
export const getFilteredMentors = async (req: Request, res: Response) => {
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

    return res.json({ mentors });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to filter mentors' });
  }
};

//  Get mentor by ID
export const getMentorById = async (req: Request, res: Response) => {
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
      return res.status(404).json({ message: 'Mentor not found' });
    }

    return res.status(200).json({ mentor });
  } catch (error) {
    console.error('Get mentor error:', error);
    return res.status(500).json({ message: 'Failed to fetch mentor profile' });
  }
};

//  Mentee requests session
export const requestSession = async (req: AuthRequest, res: Response) => {
  try {
    const { mentorId, topic } = req.body;
    const menteeId = req.user?.userId;

    if (!mentorId || !topic) {
      return res.status(400).json({ message: 'Mentor ID and topic are required' });
    }

    const session = await prisma.sessionRequest.create({
      data: {
        mentorId,
        menteeId,
        topic,
      },
    });

    return res.status(201).json({ message: 'Session request sent', session });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to send request' });
  }
};

// Mentor views incoming requests
export const getMentorRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'MENTOR') {
      return res.status(403).json({ message: 'Access denied. Mentors only.' });
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

    return res.json({ requests });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch session requests' });
  }
};

// Mentor responds to session request (accept/reject)
export const respondToRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user?.role !== 'MENTOR') {
      return res.status(403).json({ message: 'Mentors only' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or rejected' });
    }

    const request = await prisma.sessionRequest.findUnique({ where: { id } });
    if (!request || request.mentorId !== req.user.userId) {
      return res.status(404).json({ message: 'Session not found or unauthorized' });
    }

    const updated = await prisma.sessionRequest.update({
      where: { id },
      data: { status },
    });

    return res.json({ message: `Session ${status}`, request: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update session status' });
  }
};

//  Mentor sets availability
export const setAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const mentorId = req.user?.userId;
    const { day, startTime, endTime } = req.body;

    if (req.user?.role !== 'MENTOR') {
      return res.status(403).json({ message: 'Only mentors can set availability' });
    }

    const newSlot = await prisma.availability.create({
      data: {
        mentorId,
        day,
        startTime,
        endTime,
      },
    });

    return res.status(201).json({ message: 'Availability set', slot: newSlot });
  } catch (error) {
    console.error('Set availability error:', error);
    return res.status(500).json({ message: 'Failed to set availability' });
  }
};

//  Mentee submits feedback and rating
export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback, rating } = req.body;

    if (req.user?.role !== 'MENTEE') {
      return res.status(403).json({ message: 'Only mentees can submit feedback' });
    }

    if (!feedback || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Feedback and rating (1–5) are required' });
    }

    const session = await prisma.sessionRequest.findUnique({ where: { id } });
    if (!session || session.menteeId !== req.user.userId) {
      return res.status(404).json({ message: 'Session not found or unauthorized' });
    }

    const updated = await prisma.sessionRequest.update({
      where: { id },
      data: { feedback, rating },
    });

    return res.json({ message: 'Feedback submitted', session: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

// Mentor adds comment after session
export const addMentorComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { mentorComment } = req.body;

    if (req.user?.role !== 'MENTOR') {
      return res.status(403).json({ message: 'Only mentors can comment' });
    }

    const session = await prisma.sessionRequest.findUnique({ where: { id } });
    if (!session || session.mentorId !== req.user.userId) {
      return res.status(404).json({ message: 'Session not found or unauthorized' });
    }

    const updated = await prisma.sessionRequest.update({
      where: { id },
      data: { mentorComment },
    });

    return res.json({ message: 'Comment submitted', session: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

// Admin: view all users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admins only' });
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

    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Admin: update user role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MENTOR', 'MENTEE'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return res.json({ message: 'User role updated', user: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update role' });
  }
};

//  Admin: delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Admin views accepted matches
export const getAllMatches = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admins only' });
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

    return res.status(200).json({ matches });
  } catch (error) {
    console.error('Admin get matches error:', error);
    return res.status(500).json({ message: 'Failed to fetch matches' });
  }
};

// Admin sees session stats (total sessions)
export const getSessionStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const total = await prisma.sessionRequest.count();
    const accepted = await prisma.sessionRequest.count({ where: { status: 'accepted' } });
    const rejected = await prisma.sessionRequest.count({ where: { status: 'rejected' } });
    const pending = await prisma.sessionRequest.count({ where: { status: 'pending' } });

    return res.json({ total, accepted, rejected, pending });
  } catch (error) {
    console.error('Admin session stats error:', error);
    return res.status(500).json({ message: 'Failed to fetch session stats' });
  }
};


// Admin assigns mentor to mentee manually
export const assignMentor = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const { mentorId, menteeId, topic } = req.body;

    if (!mentorId || !menteeId || !topic) {
      return res.status(400).json({ message: 'mentorId, menteeId, and topic are required' });
    }

    const session = await prisma.sessionRequest.create({
      data: {
        mentorId,
        menteeId,
        topic,
        status: 'accepted',
      },
    });

    return res.status(201).json({ message: 'Mentor assigned successfully', session });
  } catch (error) {
    console.error('Assign mentor error:', error);
    return res.status(500).json({ message: 'Failed to assign mentor' });
  }
};



