const mongoose = require('mongoose');

// Define the role schema
const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: [ 'resident', 'collector','admin'], // Ensure the role is one of these values
        required: true // Ensure uniqueness of role names
    }
});

// Export the Role model
module.exports = mongoose.model('Role', roleSchema);
