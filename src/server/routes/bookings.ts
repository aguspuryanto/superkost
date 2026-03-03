import express, { Request } from 'express';
import prisma from '../db.ts';
import { authenticateToken, authorizeRole, AuthRequest } from '../auth.ts';

const router = express.Router();

// Get bookings (Admin: all, User: own)
router.get('/', authenticateToken, async (req: Request, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.sendStatus(401);
  const { role, id } = authReq.user;
  try {
    if (role === 'SUPER_ADMIN') {
      const bookings = await prisma.booking.findMany({
        include: { user: true, room: true },
      });
      res.json(bookings);
    } else if (role === 'KOST_ADMIN') {
      const bookings = await prisma.booking.findMany({
        where: { room: { kost: { adminId: id } } },
        include: { user: true, room: true },
      });
      res.json(bookings);
    } else {
      const bookings = await prisma.booking.findMany({
        where: { userId: id },
        include: { room: true },
      });
      res.json(bookings);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create booking (User)
router.post('/', authenticateToken, async (req: Request, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.sendStatus(401);
  const { roomId, startDate, endDate, totalAmount } = req.body;
  const userId = authReq.user.id;
  try {
    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalAmount,
        status: 'PENDING_APPROVAL',
      },
    });
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create booking' });
  }
});

// Update booking status (Admin)
router.put('/:id/status', authenticateToken, authorizeRole(['SUPER_ADMIN', 'KOST_ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update booking status' });
  }
});

export default router;
