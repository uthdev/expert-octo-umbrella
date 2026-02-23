const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 250
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 13
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes for performance
schoolSchema.index({ name: 1 });
schoolSchema.index({ email: 1 }, { unique: true });
schoolSchema.index({ status: 1 });

module.exports = mongoose.model('School', schoolSchema);