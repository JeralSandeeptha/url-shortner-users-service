import './config/envConfig';
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from "./utils/logger";
import './config/dbConfig';

//import routes
import appRoute from "./api/routes/app.route";
import userRoute from "./api/routes/user.routes";

const app: Application = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  credentials: true, // allow cookies to be sent
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1', appRoute);
app.use('/api/v1/user', userRoute);

// start application
app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`);
    logger.info(`User Service is running on port ${PORT}`);
});

export default app;