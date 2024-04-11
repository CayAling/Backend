// collector.js

const mongoose = require('mongoose');

const collectorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicleType: {
        type: String,
        enum: ['sidecar', 'tricycle', 'motorcycle'],
        required: true
    },
    quantityGarbageSack: {
        type: Number,
        required: true
    },
    status:
    {
        type:String,
        default: 'available'
    },
    verified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Collector', collectorSchema);
