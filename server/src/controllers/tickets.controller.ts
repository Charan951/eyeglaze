import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { Ticket } from '../models/Ticket';
import { getIO } from '../lib/socket';

export async function createTicket(req: Request, res: Response) {
  try {
    await connectDB();
    const { category, subject, orderNumber, message } = req.body || {};

    if (!category || !subject || !message) {
      return res.status(400).json({ error: 'Category, subject, and message details are required' });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate unique EGT-XXXX Ticket ID
    let ticketId = '';
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 10) {
      ticketId = `EGT-${Math.floor(1000 + Math.random() * 9000)}`;
      const existingTicket = await Ticket.findOne({ ticketId });
      if (!existingTicket) {
        exists = false;
      }
      attempts++;
    }

    // Fallback if random generator keeps colliding
    if (exists) {
      const count = await Ticket.countDocuments();
      ticketId = `EGT-${1000 + count}`;
    }

    const ticket = new Ticket({
      ticketId,
      user: userId,
      category,
      subject,
      orderNumber,
      message,
      status: 'Open',
    });

    await ticket.save();
    try {
      getIO().emit('ticket_changed', { action: 'create', ticket });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.status(201).json({ ticket });
  } catch (error) {
    console.error('CREATE ticket error:', error);
    return res.status(500).json({ error: 'Failed to submit support ticket' });
  }
}

export async function getUserTickets(req: Request, res: Response) {
  try {
    await connectDB();
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tickets = await Ticket.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ tickets });
  } catch (error) {
    console.error('GET user tickets error:', error);
    return res.status(500).json({ error: 'Failed to retrieve support tickets' });
  }
}

export async function getTicketById(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    // Gating check: only the ticket creator or an admin can access this details
    const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];
    if (ticket.user.toString() !== userId && !ADMIN_ROLES.includes(req.user!.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error('GET ticket by ID error:', error);
    return res.status(500).json({ error: 'Failed to retrieve support ticket details' });
  }
}
