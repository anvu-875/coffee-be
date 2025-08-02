import { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from './utils/path';
import logger from './utils/logger';

const swaggerJsonPath = path.join(path.rootDir, './swagger-docs.json');

function loadSwaggerSpec() {
  if (fs.existsSync(swaggerJsonPath)) {
    logger.info('[Swagger] Using prebuilt swagger-docs.json');
    return JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf-8')) as object;
  }
  throw new Error('Swagger documentation file not found. Please generate it first.');
}

const swaggerSpec = loadSwaggerSpec();

function swaggerDocs(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/', (_req, res) => {
    res.redirect('/api/docs');
  });
}

export default swaggerDocs;
