import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export const envConfig = {
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    KEYCLOACK_SERVER_URL: process.env.KEYCLOACK_SERVER_URL,
    KEYCLOACK_GATEWAY_SERVER_URL: process.env.KEYCLOACK_GATEWAY_SERVER_URL,
    KEYCLOACK_CLIENT_ID: process.env.KEYCLOACK_CLIENT_ID,
    KEYCLOACK_CLIENT_SECRET: process.env.KEYCLOACK_CLIENT_SECRET,
    BASE_URL: process.env.BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    DOMAIN: process.env.DOMAIN,
}