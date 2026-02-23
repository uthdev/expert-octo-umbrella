module.exports = {
    createSchool: [
        {
            model: 'title',
            path: 'name',
            required: true,
        },
        {
            model: 'longText',
            path: 'address',
            required: true,
        },
        {
            model: 'phone',
            required: true,
        },
        {
            model: 'email',
            required: true,
        }
    ],
    updateSchool: [
        {
            model: 'title',
            path: 'name',
        },
        {
            model: 'longText',
            path: 'address',
        },
        {
            model: 'phone',
        },
        {
            model: 'email',
        }
    ]
}