import express from 'express';
import prisma from '../db.ts';
import { authenticateToken, authorizeRole } from '../auth.ts';

const router = express.Router();

// Get all kosts (Public)
router.get('/', async (req, res) => {
  try {
    const kosts = await prisma.kost.findMany({
      include: {
        rooms: true,
      },
    });
    res.json(kosts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kosts' });
  }
});

// Create kost (Super Admin)
router.post('/', authenticateToken, authorizeRole(['SUPER_ADMIN']), async (req, res) => {
  const { name, address, description, phone, adminId } = req.body;
  try {
    const kost = await prisma.kost.create({
      data: {
        name,
        address,
        description,
        phone,
        adminId,
      },
    });
    res.status(201).json(kost);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create kost' });
  }
});

// Update kost (Super Admin or Kost Admin)
router.put('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN', 'KOST_ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { name, address, description, phone, isActive } = req.body;
  try {
    const kost = await prisma.kost.update({
      where: { id },
      data: {
        name,
        address,
        description,
        phone,
        isActive,
      },
    });
    res.json(kost);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update kost' });
  }
});

export default router;
