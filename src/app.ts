import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import { PaymentController } from './app/modules/payment/payment.controller';

const app: Application = express();
app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
        console.log("🔥 Webhook route HIT!");
        console.log("Headers:", req.headers);
        console.log("Raw Body:", req.body);
        next();
    },
    PaymentController.handleStripeWebhookEvent
);

app.use(cookieParser());

app.use(cors({
    origin: ['http://localhost:3000','https://travel-buddy-client-chi.vercel.app'],
    credentials: true
}));



//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(sanitizeInput); // ADD THIS LINE



app.get('/', (req: Request, res: Response) => {
    res.send({
        Message: "Ph health care server.."
    })
});

app.use('/api/v1', router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "API NOT FOUND!",
        error: {
            path: req.originalUrl,
            message: "Your requested path is not found!"
        }
    })
})

export default app;