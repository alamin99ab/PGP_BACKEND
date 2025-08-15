import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    pgpPublicKey: {
        type: String,
        required: true, // <-- Public key থাকতেই হবে
    },
    // নিচের এই ফিল্ডটি যোগ করা হয়েছে
    pgpPrivateKey: {
        type: String,
        required: true, // <-- Private key থাকতেই হবে
    },
}, {
    timestamps: true,
});

// পাসওয়ার্ড সেভ করার আগে হ্যাশ করার কোড (এটি সঠিক আছে)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// পাসওয়ার্ড মেলানোর কোড (এটিও সঠিক আছে)
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;