module.exports = {
    createStudent: [
        {
            model: 'name',
            path: 'firstName',
            required: true,
        },
        {
            model: 'name',
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
            model: 'objectId',
            path: 'schoolId',
            required: true,
        },
        {
            model: 'objectId',
            path: 'classroomId',
        }
    ],
    updateStudent: [
        {
            model: 'name',
            path: 'firstName',
        },
        {
            model: 'name',
            path: 'lastName',
        },
        {
            model: 'email',
        },
        {
            model: 'phone',
        }
    ],
    transferStudent: [
        {
            model: 'objectId',
            path: 'newClassroomId',
            required: true,
        }
    ]
}