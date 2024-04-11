
const Invoice =require ('../models/Invoice')
const Booking = require('../models/Booking');
const User = require ('../models/User');
const BinCategory = require ('../models/BinCategory');
const Collector = require ('../models/collectors');

exports.createInvoice = async (req, res) => {
    try {
        const { bookingId } = req.body;

        // Check if an invoice already exists for the bookingId
        const existingInvoice = await Invoice.findOne({ bookingId });
        if (existingInvoice) {
            return res.status(400).json({ message: 'Invoice already exists for this booking' });
        }

        // Find the booking to get the totalPayment
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'userId',
                select: 'username contact location' // Populate the resident's name and contact
            })
            .populate({
                path: 'binCategoryId',
                select: 'category quantity' // Populate the bin category's name
            })
            .populate({
                path: 'collectorId',
                select: 'name' // Populate the collector's name
            });

        // Debugging logs to check if the booking is fetched and populated
        console.log('Booking:', booking);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const { totalPayment } = booking;

        // Create a new invoice
        const invoice = new Invoice({ bookingId, amount: totalPayment, status: 'Pending' });
        await invoice.save();

        res.status(201).json({ message: 'Invoice created successfully', invoice , booking});
    } catch (err) {
        console.error('Error while creating invoice:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { invoiceId } = req.body; // Get the invoice ID from the request body
        console.log('Received invoice ID:', invoiceId); // Log the received invoice ID

        // Check if the invoice ID is provided
        if (!invoiceId) {
            return res.status(400).json({ message: 'Invoice ID is required' });
        }

        // Update invoice status to "Paid"
        const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, { status: 'Paid' }, { new: true });

        // Check if the invoice was found and updated
        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json({ message: 'Invoice status updated successfully', updatedInvoice });
    } catch (err) {
        console.error('Error while updating invoice status:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.getInvoiceById = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        // Find the invoice by ID
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json({ invoice });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
