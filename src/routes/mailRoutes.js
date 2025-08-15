import express from 'express';
// decryptMail ফাংশনটি ইম্পোর্ট করুন
import { sendMail, getInbox, getMailById, decryptMail } from '../controllers/mailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// এখানে রুটগুলো চেইন করা হয়েছে, যা কোডকে আরও পরিচ্ছন্ন করে
router.route('/send').post(protect, sendMail);
router.route('/inbox').get(protect, getInbox);

// নতুন decrypt রুট যোগ করা হয়েছে
router.route('/decrypt').post(protect, decryptMail);

router.route('/:id').get(protect, getMailById);


export default router;