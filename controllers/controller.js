import ContactUs from '../models/contactUs.js';
import mongoose from 'mongoose';
import Analytics from '../models/analytics.js';

const storeKeyClick = async (req, res) => {
    try {
        const { eventType } = req.body;

        // Validate required fields
        if (!eventType) return res.status(400).json({ error: 'Event type is required' });
        if (!['getHired', 'resumeDownloaded', 'discussProject'].includes(eventType)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }

        // Extract info from request
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const referrer = req.headers['referer'] || req.headers['referrer'];

        // Create a new analytics entry
        const saved = await Analytics.create({
            eventType,
            ipAddress,
            userAgent,
            referrer
        });

        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ error: 'Failed to store key click' });
    }
};

// API 2: Contact Us
const contactUs = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const saved = await ContactUs.create({ name, email, subject, message });
        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit contact form' });
    }
};

const getContactUs = async (req, res) => {
    try {
        const contacts = await ContactUs.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: contacts });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
}

const getAnalytics = async (req, res) => {
    try {
        // Get analytics data grouped by week and eventType
        const currentDate = new Date();
        const twoWeeksAgo = new Date(currentDate);
        twoWeeksAgo.setDate(currentDate.getDate() - 14); // Compare last 2 weeks

        const analytics = await Analytics.aggregate([
            {
                $match: {
                    timestamp: { $gte: twoWeeksAgo } 
                }
            },
            {
                $group: {
                    _id: {
                        eventType: "$eventType",
                        week: { $week: "$timestamp" },
                        year: { $year: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.week": 1 }
            }
        ]);

        // Group counts by eventType → { "getHired": { "2024-W20": 15, "2024-W21": 10 }, ... }
        const weeklyStats = {};
        analytics.forEach(entry => {
            const eventType = entry._id.eventType;
            const weekKey = `Week ${entry._id.week}`;
            
            if (!weeklyStats[eventType]) weeklyStats[eventType] = {};
            weeklyStats[eventType][weekKey] = entry.count; 
        });

        // Calculate growth/decline %
        const results = {};
        const eventTypes = ['getHired', 'resumeDownloaded', 'discussProject'];

        eventTypes.forEach(eventType => {
            const weeks = Object.keys(weeklyStats[eventType] || {});
            
            if (weeks.length >= 2) {
                const lastWeek = weeks[weeks.length - 1];
                const prevWeek = weeks[weeks.length - 2];
                const lastCount = weeklyStats[eventType][lastWeek] || 0;
                const prevCount = weeklyStats[eventType][prevWeek] || 0;

                // Calculate % change (negative = decline)
                let changePercent = ((lastCount - prevCount) / prevCount) * 100;
                changePercent = isFinite(changePercent) ? changePercent.toFixed(2) : 0;

                results[eventType] = {
                    currentWeek: lastCount,
                    previousWeek: prevCount,
                    change: `${changePercent}% ${changePercent >= 0 ? '▲' : '▼'}`,
                    trend: changePercent >= 0 ? "growth" : "decline"
                };
            } else { // Not enough data for comparison
                results[eventType] = {
                    currentWeek: weeklyStats[eventType] ? weeklyStats[eventType][weeks[0]] : 0,
                    previousWeek: 0,
                    change: "N/A",
                    trend: "insufficient data"
                };
            }
        });

        res.status(200).json({ 
            success: true, 
            weeklyComparison: results 
        });
    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ error: 'Failed to compute analytics' });
    }
};


export { storeKeyClick, contactUs, getContactUs, getAnalytics };