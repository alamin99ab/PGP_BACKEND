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

    const pgpPassphrase = password; 
    const { publicKeyArmored } = await generatePGPKeyPair(email, pgpPassphrase);

    const user = await User.create({
        username,
        email,
        password,
        pgpPublicKey: publicKeyArmored,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            pgpPublicKey: user.pgpPublicKey,
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
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');

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