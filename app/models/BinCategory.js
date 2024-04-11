const mongoose = require('mongoose');

const binCategorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: String,
        enum: ['smallSack', 'bigSack'],
        required: true
    },
    quantity: {
        type: Number, 
        required: true
    }
});

module.exports = mongoose.model('BinCategory', binCategorySchema);