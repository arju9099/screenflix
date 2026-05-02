const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theaterRoutes = require('./routes/theaterRoutes');
const showTimeRoutes = require('./routes/showTimeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// Routes
// We need raw body for Stripe webhook, so place it before express.json() if you implement full webhook logic
app.use('/api/bookings', bookingRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/showtimes', showTimeRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', datetime: new Date() });
});

// Database Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connection established successfully'))
    .catch((err) => console.error('MongoDB connection error: ', err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
