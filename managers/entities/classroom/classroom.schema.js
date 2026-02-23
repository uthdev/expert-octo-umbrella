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
            model: 'id',
            path: 'schoolId',
            required: true,
        },
        {
            model: 'arrayOfStrings',
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
            model: 'arrayOfStrings',
            path: 'resources',
        }
    ]
}