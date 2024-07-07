module.exports = {
    apps: [
        {
            name: 'book-review-system-server',
            script: 'dist/index.js',
            watch: true,
            env: {
                // NODE_ENV: 'production',
                PORT: process.env.PORT || 4000,
            },
        }
    ],
};
