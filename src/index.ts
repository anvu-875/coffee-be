import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import AppError from './utils/app-error';
import globalErrorHandler from './controllers/error.controller';
import authRouter, { authRouteName } from './routes/auth.route';

// Load environment variables
dotenv.config();

const app = express();

// 1) GLOBAL MIDDLEWARES
// set security HTTP headers
app.use(helmet());
app.use(cors());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
console.log('Env currently running on: ' + process.env.NODE_ENV);

// limit the number of requests from the same IP
// in this case, 100 requests per hour
const timeWindow = 60 * 60 * 1000; // 1 hour
const maxRequest = 100;

const limiter = rateLimit({
  max: maxRequest,
  windowMs: timeWindow,
  message: 'Too many requests from this IP, please try again in an hour!',
});

// apply the limiter to all routes that start with /api
app.use('/api', limiter);

// middleware to parse the body of the request into json
// limit the size of the body to 10kb
app.use(express.json({ limit: '10kb' }));

// middleware to parse the urlencoded body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const whitelisted: string[] = [];
// hpp - html param pollution will remove the duplicate parameter
app.use(
  hpp({
    whitelist: whitelisted,
  })
);

// middleware to serve static files
app.use(express.static(`${__dirname}/public`));

// middleware to define API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coffee Shop API',
      version: '1.0.0',
      description: 'API documentation for the Coffee Shop backend',
    },
    servers: [
      {
        url: 'http://localhost:' + (process.env.PORT || 3000) + '/api',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

// generate the API document web page
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/', (req, res) => {
  res.send('Coffee Shop Backend API');
});

// 2) ROUTES
app.use(`/api/${authRouteName}`, authRouter);

// 3) ERROR HANDLING
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
