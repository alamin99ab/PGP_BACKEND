import asyncHandler from 'express-async-handler';
import * as openpgp from 'openpgp'; // <-- পরিবর্তনটি এখানে
import Email from '../models/Email.js';
import User from '../models/User.js';
import { encryptMessage } from '../utils/pgpUtils.js';

// @desc    Send a new email
// @route   POST /api/mail/send
// @access  Private
const sendMail = asyncHandler(async (req, res) => {
    const { toEmail, subject, body } = req.body;
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
        });
    } catch (encryptionError) {
        console.error("Encryption failed in mailController:", encryptionError);
        res.status(500);
        throw new Error("Failed to encrypt email. Please try again.");
    }
});

// @desc    Get user's inbox
// @route   GET /api/mail/inbox
// @access  Private
const getInbox = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const emails = await Email.find({ recipient: userId })
        .populate('sender', 'username email')
        .sort({ sentAt: -1 });

    res.json(emails);
});

// @desc    Get a specific mail by ID
// @route   GET /api/mail/:id
// @access  Private
const getMailById = asyncHandler(async (req, res) => {
    const mailId = req.params.id;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: mailId, recipient: userId })
        .populate('sender', 'username email');

    if (!email) {
        res.status(404);
        throw new Error('Mail not found or you are not the recipient');
    }

    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    res.json(email);
});

// @desc    Decrypt a mail
// @route   POST /api/mail/decrypt
// @access  Private
const decryptMail = asyncHandler(async (req, res) => {
    const { encryptedMessage, privateKeyArmored, passphrase } = req.body;

    if (!encryptedMessage || !privateKeyArmored || !passphrase) {
        res.status(400);
        throw new Error('Please provide encrypted message, private key, and passphrase');
    }

    try {
        const privateKey = await openpgp.readKey({ armoredKey: privateKeyArmored });

        const { data: decryptedText } = await openpgp.decrypt({
            message: await openpgp.readMessage({ armoredMessage: encryptedMessage }),
            decryptionKeys: privateKey,
            passwords: [passphrase],
        });

        res.json({ decryptedText });
    } catch (error) {
        console.error('Decryption failed:', error);
        res.status(500).json({ message: 'Decryption failed. Check your private key and passphrase.', error: error.message });
    }
});


export { sendMail, getInbox, getMailById, decryptMail };