const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    omdbId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    plot: { type: String },
    posterUrl: { type: String },
    releaseDate: { type: String },
    runtime: { type: String },
    genre: { type: String },
    director: { type: String },
    actors: { type: String },
    imdbRating: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movie', movieSchema);
