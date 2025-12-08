import express from 'express';
import { userRoutes } from '../modules/user/user.router';
import { tripRoutes } from '../modules/Trip/trip.route';
import { authRoutes } from '../modules/auth/auth.route';
import { SubscriptionRoutes } from '../modules/subscription/subscription.router';
import { buddyRoutes } from '../modules/buddyRequest/buddyRequest.router';
import { chatRoutes } from '../modules/chat/chat.route';
import { reportRoute } from '../modules/report/report.route';
import { reviewRouter } from '../modules/review/review.route';
import {  MeetupRoutes } from '../modules/meetup/meetup.route';
import { notificationRouter } from '../modules/notification/notification.route';
import { AdminRoutes } from '../modules/admin/admin.route';
import { ModeratorRoutes } from '../modules/moderator/moderator.route';
import { TravelerRoutes } from '../modules/traveller/traveller.route';
import { SubscriptionPlanRoutes } from '../modules/subscriptionPlan/subscriptionPlan.route';
import { MetaRoutes } from '../modules/Meta/meta.route';

const router = express.Router();




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
        path: '/subscription-plan',
        route: SubscriptionPlanRoutes
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
        route: MeetupRoutes
    },
    {
        path: '/report',
        route: reportRoute
    },
    {
        path: '/review',
        route: reviewRouter
    },
    {
        path: '/notifications',
        route: notificationRouter
    },
    {
        path: '/admin',
        route: AdminRoutes
    },
    {
        path: '/moderator',
        route: ModeratorRoutes
    },
    {
        path: '/traveler',
        route: TravelerRoutes
    },
    {
        path: '/meta',
        route: MetaRoutes
    }
];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;