import express from 'express';
import prisma from '../db.ts';
import { authenticateToken, authorizeRole } from '../auth.ts';

const router = express.Router();

// Get rooms by kostId (Public)
router.get('/:kostId', async (req, res) => {
  const { kostId } = req.params;
  try {
    const rooms = await prisma.room.findMany({
      where: { kostId },
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create room (Super Admin or Kost Admin)
router.post('/', authenticateToken, authorizeRole(['SUPER_ADMIN', 'KOST_ADMIN']), async (req, res) => {
  const { kostId, name, price, description, status } = req.body;
  try {
    const room = await prisma.room.create({
      data: {
        kostId,
        name,
        price,
        description,
        status: status || 'AVAILABLE',
      },
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create room' });
  }
});

// Update room (Super Admin or Kost Admin)
router.put('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN', 'KOST_ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { name, price, description, status } = req.body;
  try {
    const room = await prisma.room.update({
      where: { id },
      data: {
        name,
        price,
        description,
        status,
      },
    });
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update room' });
  }
});

export default router;
