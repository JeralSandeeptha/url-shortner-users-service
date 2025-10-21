import pg from 'pg';
import logger from '../utils/logger';
import { envConfig } from './envConfig';

const pool = new pg.Pool({
    connectionString: envConfig.DATABASE_URL,
});

// test the database connection
const testConnection = async () => {
    try {
        await pool.connect();
        logger.info('Database connection established successfully');
    } catch (error) {
        logger.error('Database connection failed');
        logger.error(error);
    }
};

// test the connection
testConnection();

export default pool;