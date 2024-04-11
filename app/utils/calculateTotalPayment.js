// utils.js

const BinCategory = require('../models/BinCategory');

const calculateTotalPayment = async (category) => {
    try {
        const binCategory = await BinCategory.findById(category);
        if (!binCategory) {
            throw new Error('Bin category not found');
        }

        let price;
        if (binCategory.category === 'smallSack') {
            price = 10; // Price for small sack
        } else if (binCategory.category === 'bigSack') {
            price = 15; // Price for big sack
        } else {
            throw new Error('Invalid bin category');
        }

        const totalPayment = price * binCategory.quantity;
        
        if (isNaN(totalPayment)) {
            throw new Error('Failed to calculate total payment');
        }

        return totalPayment;
    } catch (error) {
        throw new Error(`Error calculating total payment: ${error.message}`);
    }
};
module.exports = { calculateTotalPayment };
