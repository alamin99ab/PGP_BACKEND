import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { generateToken } from '../utils/authUtils.js';
import { generatePGPKeyPair } from '../utils/pgpUtils.js';

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400);
        throw new Error('Please enter all fields');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email');
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
        res.status(400);
        throw new Error('Username already taken');
    }

    // PGP কী জেনারেট করার সময় পাসওয়ার্ড ব্যবহার করা হয় private key এনক্রিপ্ট করার জন্য
    const pgpPassphrase = password; 
    
    // generatePGPKeyPair থেকে public এবং private দুটো কী-ই গ্রহণ করুন
    const { publicKeyArmored, privateKeyArmored } = await generatePGPKeyPair(email, pgpPassphrase);

    const user = await User.create({
        username,
        email,
        password, // <-- User মডেলে পাসওয়ার্ড স্বয়ংক্রিয়ভাবে হ্যাশ হওয়া উচিত (pre-save hook ব্যবহার করে)
        pgpPublicKey: publicKeyArmored,
        pgpPrivateKey: privateKeyArmored, // <-- Private Key ডাটাবেসে সেভ করুন
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            pgpPublicKey: user.pgpPublicKey,
            // রেজিস্ট্রেশনের সময় private key পাঠানোর দরকার নেই
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
            pgpPublicKey: user.pgpPublicKey,
            pgpPrivateKey: user.pgpPrivateKey, // <-- লগইনের সময় private key পাঠান
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    // প্রোফাইল দেখার সময় private key দেখানোর প্রয়োজন নেই
    const user = await User.findById(req.user._id).select('-password -pgpPrivateKey');

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            pgpPublicKey: user.pgpPublicKey,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export { registerUser, loginUser, getUserProfile };