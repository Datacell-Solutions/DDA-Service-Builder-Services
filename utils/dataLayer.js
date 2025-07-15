const sequelize = require('../config/database');

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

const disconnectDB = async () => {
    try {
        await sequelize.close();
        console.log('Database disconnected successfully.');
    } catch (error) {
        console.error('Error disconnecting database:', error);
    }
};

module.exports = { connectDB, disconnectDB };
