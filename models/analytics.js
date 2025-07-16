import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
    eventType: {
        type: String,
        enum: ['getHired', 'resumeDownloaded', 'discussProject'],
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    referrer: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    // You can add more fields as needed, e.g., location, sessionId, etc.
}, { timestamps: true });

export default mongoose.model('Analytics', analyticsSchema);