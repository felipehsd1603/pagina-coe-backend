import { Router } from 'express';
import { appsRouter } from './apps.routes';
import { metricsRouter } from './metrics.routes';
import { testimonialsRouter } from './testimonials.routes';
import { coursesRouter } from './courses.routes';
import { demandsRouter } from './demands.routes';
import { authRouter } from './auth.routes';
import { adminRouter } from './admin.routes';
import { coeRouter } from './coe.routes';

export const routes = Router();

routes.use('/apps', appsRouter);
routes.use('/metrics', metricsRouter);
routes.use('/testimonials', testimonialsRouter);
routes.use('/courses', coursesRouter);
routes.use('/demands', demandsRouter);
routes.use('/auth', authRouter);
routes.use('/admin', adminRouter);
routes.use('/coe', coeRouter);
