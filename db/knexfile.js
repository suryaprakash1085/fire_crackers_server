// db/knexfile.js
import dotenv from 'dotenv';
dotenv.config();
// console.log("Starting",process.env.DB_HOST,process.env.DB_USER,process.env.DB_PASSWORD,process.env.DB_NAME)
export default {
  development: {
    client: 'mysql2',
   connection: {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT || 3306
},
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  production: {
    // Your production database settings
  }
};
