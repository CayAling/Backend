const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    binCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BinCategory'
    },
    
    scheduleDate: {
        type: Date,
        required: true
    },
    scheduleTime: {
        type: String,
        required: true
    },
    totalPayment: Number,

    collectorName: {
        type: String,
        required: true
    },
    collectorId: { // Add collectorId to store the ID of the assigned collector
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector',
        required: true
    },
    status: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
