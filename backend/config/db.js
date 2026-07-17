const mongoose = require('mongoose');

/**
 * Reusable MongoDB Connection Module using Mongoose ODM
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('DATABASE ERROR: MONGODB_URI or MONGO_URI environment variable is missing.');
      process.exit(1);
    }

    // Configure Mongoose global options
    // strictQuery ensures queries only filter on schema-defined properties (improves security)
    mongoose.set('strictQuery', true);

    // Mongoose Connection options
    const connectionOptions = {
      autoIndex: process.env.NODE_ENV !== 'production', // Disable automatic indexing in production for performance
      serverSelectionTimeoutMS: 5000, // Timeout connection attempts after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 50, // Optimize database connection pooling capacity for concurrent requests load
    };

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI, connectionOptions);
    
    console.log('DATABASE SUCCESS: MongoDB connected successfully. Connected to host:', mongoose.connection.host);
  } catch (error) {
    console.error('DATABASE ERROR: Initial MongoDB connection failed 💥');
    // Log meaningful error details safely without leaking credentials
    if (error.message.includes('ENOTFOUND')) {
      console.error('Detail: Host name could not be resolved (Network or connection string syntax issue).');
    } else if (error.message.includes('Authentication failed')) {
      console.error('Detail: Invalid database username or password.');
    } else {
      console.error(`Detail: ${error.name} - ${error.message}`);
    }
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('DATABASE WARN: Proceeding without active MongoDB connection. (Database features will fail until connection string is configured in .env).');
    }
  }
};

// Monitor active Mongoose connection state transitions
mongoose.connection.on('disconnected', () => {
  console.warn('DATABASE ALERT: MongoDB connection lost. Attempting auto-reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error('DATABASE ERROR: MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('DATABASE SUCCESS: MongoDB connection restored.');
});

// Graceful application shutdown hooks to close DB socket threads
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('DATABASE INFO: MongoDB connection closed due to application termination.');
  process.exit(0);
});

module.exports = connectDB;
