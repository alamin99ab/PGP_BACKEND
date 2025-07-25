import express from 'express';
import { sendMail, getInbox, getMailById } from '../controllers/mailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', protect, sendMail);
router.get('/inbox', protect, getInbox);
router.get('/:id', protect, getMailById);

export default router;