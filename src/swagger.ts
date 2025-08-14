import { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import logger from './utils/logger';
import fs from 'fs';
import path from 'path';

function loadSwaggerSpec() {
  const swaggerJsonPath = path.join(__dirname, './api-spec.json');
  const swaggerYamlPath = path.join(__dirname, './api-spec.yaml');

  if (fs.existsSync(swaggerJsonPath) && fs.existsSync(swaggerYamlPath)) {
    logger.info('[Swagger] Using prebuilt API specifications');
    return {
      json: fs.readFileSync(swaggerJsonPath, 'utf-8'),
      yaml: fs.readFileSync(swaggerYamlPath, 'utf-8')
    };
  }

  throw new Error(
    'Swagger documentation file not found. Please generate it first.'
  );
}

const apiSpecFormats = loadSwaggerSpec();

const swaggerSpec = JSON.parse(apiSpecFormats.json) as object;

function swaggerDocs(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(apiSpecFormats.json);
  });

  app.get('/api/docs.yaml', (_req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(apiSpecFormats.yaml);
  });

  app.get('/', (_req, res) => {
    res.redirect('/api/docs');
  });
}

export default swaggerDocs;
