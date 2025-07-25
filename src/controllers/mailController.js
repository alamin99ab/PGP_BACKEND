import asyncHandler from 'express-async-handler';
import Email from '../models/Email.js';
import User from '../models/User.js';
import { encryptMessage } from '../utils/pgpUtils.js';

const sendMail = asyncHandler(async (req, res) => {
    const { toEmail, subject, body, attachment } = req.body;
    const senderId = req.user._id;

    if (!toEmail || !subject || !body) {
        res.status(400);
        throw new Error('Please enter all required fields: To, Subject, Body');
    }

    const recipientUser = await User.findOne({ email: toEmail });

    if (!recipientUser) {
        res.status(404);
        throw new Error('Recipient user not found.');
    }
    if (!recipientUser.pgpPublicKey) {
         res.status(400);
         throw new Error(`Recipient (${toEmail}) does not have a PGP public key. Cannot send encrypted mail.`);
    }

    try {
        const encryptedBody = await encryptMessage(body, recipientUser.pgpPublicKey);
        const encryptedSubject = await encryptMessage(subject, recipientUser.pgpPublicKey);

        const email = await Email.create({
            sender: senderId,
            recipient: recipientUser._id,
            subject: encryptedSubject,
            body: encryptedBody,
            isRead: false,
            sentAt: new Date(),
        });

        res.status(201).json({
            message: 'Email sent successfully (encrypted via server)',
            emailId: email._id,
            sender: req.user.email,
            recipient: recipientUser.email,
            subject: 'Encrypted',
            body: 'Encrypted',
        });
    } catch (encryptionError) {
        console.error("Encryption failed in mailController:", encryptionError);
        res.status(500);
        throw new Error("Failed to encrypt email. Please try again.");
    }
});

const getInbox = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const emails = await Email.find({ recipient: userId })
                              .populate('sender', 'username email')
                              .sort({ sentAt: -1 });

    const processedEmails = emails.map(email => ({
        _id: email._id,
        sender: email.sender,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        isRead: email.isRead,
        sentAt: email.sentAt,
        createdAt: email.createdAt,
        updatedAt: email.updatedAt,
    }));

    res.json(processedEmails);
});

const getMailById = asyncHandler(async (req, res) => {
    const mailId = req.params.id;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: mailId, recipient: userId })
                             .populate('sender', 'username email');

    if (!email) {
        res.status(404);
        throw new Error('Mail not found or you are not the recipient');
    }

    email.isRead = true;
    await email.save();

    res.json({
        _id: email._id,
        sender: email.sender,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        isRead: email.isRead,
        sentAt: email.sentAt,
        createdAt: email.createdAt,
        updatedAt: email.updatedAt,
    });
});

export { sendMail, getInbox, getMailById };