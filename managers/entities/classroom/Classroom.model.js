const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        max: 999999
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    resources: [{
        type: String,
        trim: true,
        maxlength: 100
    }],
    currentEnrollment: {
        type: Number,
        default: 0,
        min: 0
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
classroomSchema.index({ schoolId: 1 });
classroomSchema.index({ name: 1, schoolId: 1 });
classroomSchema.index({ status: 1 });

// Virtual for available capacity
classroomSchema.virtual('availableCapacity').get(function() {
    return this.capacity - this.currentEnrollment;
});

module.exports = mongoose.model('Classroom', classroomSchema);