import { Router } from 'express';
import { AiService } from '../services/ai.service';

const router = Router();

router.post('/chat', async (req, res, next) => {
  try {
    const { message, history, pageContext } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const reply = await AiService.generateChatResponse(
      message,
      history || [],
      pageContext || { pageName: 'General', pathname: '/' }
    );

    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

export default router;
