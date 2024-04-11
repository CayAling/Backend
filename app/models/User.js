const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    
    username: String,
    email: String,
    password: String,
    contact: String,
    location:String,
    
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role', // Reference to the Role model
    }],
    idPicture: {
        type: String 
    },
    license: {
        type: String 
    },
    biodata: {
        type: String 
    },
    birthCertificate: {
        type: String 
    },
    profilePicture: {
        type: String,
        default: '/default-profile-picture.jpg' // Assuming default profile picture file path
    },
    completedServices:
    {
        type: Number,
        default: 0
    }
},
{ timestamps: true });

module.exports = mongoose.model('User', userSchema);
