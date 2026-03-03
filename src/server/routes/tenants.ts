import express, { Request } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.ts';
import { authenticateToken, authorizeRole, AuthRequest } from '../auth.ts';
import { sendNotification } from '../socket.ts';

const router = express.Router();

// Onboard new tenant (Admin/Staff)
router.post('/onboard', authenticateToken, authorizeRole(['SUPER_ADMIN', 'KOST_ADMIN', 'STAFF']), async (req: Request, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.sendStatus(401);
  const { 
    name, email, phone, password, // User details
    emergencyName, emergencyRelation, emergencyPhone, // Emergency contact
    roomId, startDate, endDate, totalAmount, // Booking
    agreementContent // Rental Agreement
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 10);
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: 'TENANT',
        },
      });
    }

    // Create Emergency Contact
    if (emergencyName) {
      await prisma.emergencyContact.create({
        data: {
          userId: user.id,
          name: emergencyName,
          relation: emergencyRelation,
          phone: emergencyPhone,
        },
      });
    }

    // Create Booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalAmount,
        status: 'APPROVED_UNPAID', // Auto-approve for onboarded tenants
      },
    });

    // Create Rental Agreement
    if (agreementContent) {
      await prisma.rentalAgreement.create({
        data: {
          bookingId: booking.id,
          content: agreementContent,
        },
      });
    }

    // Create Initial Invoice (Payment PENDING)
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        status: 'PENDING',
      },
    });

    // Notify Tenant
    await sendNotification(
      user.id,
      'INFO',
      'Welcome to SuperKost!',
      'Your account has been created. Please log in to view your booking and sign the agreement.'
    );

    // Notify Admin (Self)
    if (authReq.user) {
        await sendNotification(
            authReq.user.id,
            'SUCCESS',
            'Tenant Onboarded',
            `Successfully onboarded ${name} to Room.`
        );
    }

    res.status(201).json({ message: 'Tenant onboarded successfully', userId: user.id, bookingId: booking.id });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to onboard tenant: ' + error.message });
  }
});

// Get tenant details (Admin/Staff)
router.get('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN', 'KOST_ADMIN', 'STAFF']), async (req, res) => {
    const { id } = req.params;
    try {
        const tenant = await prisma.user.findUnique({
            where: { id },
            include: {
                emergencyContacts: true,
                bookings: {
                    include: {
                        room: true,
                        rentalAgreement: true
                    }
                }
            }
        });
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        res.json(tenant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tenant' });
    }
});

export default router;
