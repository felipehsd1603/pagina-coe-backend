import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { routes } from './routes';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Portal AEGEA - API Docs',
}));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/v1', routes);

app.use(errorHandler);

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`[backend] Servidor rodando na porta ${PORT}`);
  console.log(`[backend] API disponivel em http://localhost:${PORT}/api/v1`);
  console.log(`[backend] Swagger docs em http://localhost:${PORT}/api/docs`);
});

export default app;
