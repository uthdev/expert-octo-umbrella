module.exports = {
    createStudent: [
        {
            model: 'text',
            path: 'firstName',
            required: true,
        },
        {
            model: 'text',
            path: 'lastName',
            required: true,
        },
        {
            model: 'email',
            required: true,
        },
        {
            model: 'phone',
        },
        {
            model: 'id',
            path: 'schoolId',
            required: true,
        },
        {
            model: 'id',
            path: 'classroomId',
        }
    ],
    updateStudent: [
        {
            model: 'text',
            path: 'firstName',
        },
        {
            model: 'text',
            path: 'lastName',
        },
        {
            model: 'email',
        },
        {
            model: 'phone',
        },
        {
            model: 'id',
            path: 'classroomId',
        }
    ],
    transferStudent: [
        {
            model: 'id',
            path: 'classroomId',
            required: true,
        }
    ]
}