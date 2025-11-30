import express from 'express';
import { userRoutes } from '../modules/user/user.router';

const router = express.Router();



// router.use(); // Apply to all routes

const moduleRoutes = [
    {
        path: '/users',
        route: userRoutes
    },

];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;