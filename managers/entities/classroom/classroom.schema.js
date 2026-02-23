module.exports = {
    createClassroom: [
        {
            model: 'title',
            path: 'name',
            required: true,
        },
        {
            model: 'number',
            path: 'capacity',
            required: true,
        },
        {
            model: 'objectId',
            path: 'schoolId',
            required: true,
        },
        {
            model: 'array',
            path: 'resources',
        }
    ],
    updateClassroom: [
        {
            model: 'title',
            path: 'name',
        },
        {
            model: 'number',
            path: 'capacity',
        },
        {
            model: 'array',
            path: 'resources',
        }
    ]
}