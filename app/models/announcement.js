const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: String,
    content: String,
    targetRoles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }]
});

module.exports = mongoose.model('Announcement', announcementSchema);
