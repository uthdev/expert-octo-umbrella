module.exports = {
    login: [
        {
            model: 'email',
            required: true,
        },
        {
            model: 'password',
            required: true,
        }
    ],
    createSuperAdmin: [
        {
            model: 'email',
            required: true,
        },
        {
            model: 'password',
            required: true,
        }
    ]
};