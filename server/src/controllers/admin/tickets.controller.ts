import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Ticket } from '../../models/Ticket';
import { getIO } from '../../lib/socket';

export async function adminGetAllTickets(req: Request, res: Response) {
  try {
    await connectDB();
    // Fetch all tickets and populate the user details (name, email, mobile)
    const tickets = await Ticket.find({})
      .populate('user', 'name email mobile phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({ tickets });
  } catch (error) {
    console.error('ADMIN GET all tickets error:', error);
    return res.status(500).json({ error: 'Failed to retrieve all support tickets' });
  }
}

export async function adminUpdateTicket(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const { status, adminResponse } = req.body || {};

    if (status && !['Open', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid ticket status. Must be Open or Resolved.' });
    }

    const updateFields: Record<string, any> = {};
    if (status) updateFields.status = status;
    if (adminResponse !== undefined) updateFields.adminResponse = adminResponse;

    const ticket = await Ticket.findByIdAndUpdate(id, updateFields, { returnDocument: 'after' })
      .populate('user', 'name email mobile phone');

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    try {
      getIO().emit('ticket_changed', { action: 'update', ticket });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error('ADMIN UPDATE ticket error:', error);
    return res.status(500).json({ error: 'Failed to update support ticket' });
  }
}
