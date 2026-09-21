const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

async function initializeDatabase() {
  try {
    // 1. Establish connection to MySQL server without database specified
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : ''
    });

    const dbName = process.env.DB_NAME || 'freelance_marketplace';
    console.log(`Checking if database '${dbName}' exists...`);
    
    // 2. Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.end();
    console.log(`Database '${dbName}' verified/created.`);

    // 3. Create the connection pool with the database selected
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('MySQL connection pool established successfully.');
    return pool;
  } catch (error) {
    console.error('Error initializing MySQL database connection:', error);
    throw error;
  }
}

// Access pool instance, initialize if not already done
async function getPool() {
  if (!pool) {
    await initializeDatabase();
  }
  return pool;
}

module.exports = {
  getPool,
  initializeDatabase
};
