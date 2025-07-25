import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import errorHandler from './middleware/errorHandler.js'; // Corrected import
import connectDB from './config/db.js'; // Corrected import

import userRoutes from './routes/userRoutes.js'; // Corrected import
import mailRoutes from './routes/mailRoutes.js'; // Corrected import

const app = express();

connectDB();

app.use(helmet());

const corsOptions = {
    origin: process.env.CLIENT_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/mail', mailRoutes);

app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use(errorHandler);

export default app;