import express from 'express';
import { userRoutes } from '../modules/user/user.router';
import { tripRoutes } from '../modules/Trip/trip.route';
import { authRoutes } from '../modules/auth/auth.route';
import { SubscriptionRoutes } from '../modules/subscription/subscription.router';
import { buddyRoutes } from '../modules/buddyRequest/buddyRequest.router';
import { chatRoutes } from '../modules/chat/chat.route';
import { meetupRouter } from '../modules/meetup/meetup.route';

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
    },
    {
        path: '/chat',
        route: chatRoutes

    },
    {
        path: '/meetup',
        route: meetupRouter
    }

];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;