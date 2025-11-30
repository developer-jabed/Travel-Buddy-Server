import express from 'express';
import { userRoutes } from '../modules/user/user.router';
import { tripRoutes } from '../modules/Trip/trip.route';
import { authRoutes } from '../modules/auth/auth.route';
import { SubscriptionRoutes } from '../modules/subscription/subscription.router';
import { buddyRoutes } from '../modules/buddyRequest/buddyRequest.router';

const router = express.Router();



// router.use(); // Apply to all routes

const moduleRoutes = [
    {
        path: '/users',
        route: userRoutes
    },
    {
        path: '/trips',
        route: tripRoutes
    },
    {
        path: '/auth',
        route: authRoutes
    },
    {
        path: '/subscriptions',
        route: SubscriptionRoutes
    },
    {
        path: '/buddy',
        route: buddyRoutes
    }

];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;