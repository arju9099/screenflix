const mongoose = require('mongoose');

const showTimeSchema = new mongoose.Schema({
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theaterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
    screen: { type: String, default: 'Screen 1' },
    startTime: { type: Date, required: true },
    ticketPrice: { type: Number }, // Base/Fallback price
    seatsPerRow: { type: Number, default: 10 },
    layoutConfig: [{
        category: String,
        rows: [String], // e.g. ["A", "B"]
        price: Number
    }],
    seats: [{
        seatNumber: { type: String, required: true },
        status: { type: String, enum: ['available', 'booked'], default: 'available' },
        category: { type: String },
        price: { type: Number }
    }],
    createdAt: { type: Date, default: Date.now }
}, {
    optimisticConcurrency: true // Mongoose 5.10+ native optimistic locking
});

module.exports = mongoose.model('ShowTime', showTimeSchema);
