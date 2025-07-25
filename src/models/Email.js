import mongoose from 'mongoose';

const emailSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    subject: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    attachments: [{
        filename: String,
        contentType: String,
        fileUrl: String,
    }],
    isRead: {
        type: Boolean,
        default: false,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Email = mongoose.model('Email', emailSchema);
export default Email;