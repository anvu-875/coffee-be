import { type Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import env from './utils/env';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coffee Shop API',
      version: '1.0.0',
      description: 'API documentation for the Coffee Shop backend'
    },
    servers: [
      {
        url: `${env.URL}/api`
      }
    ]
  },
  apis: ['dist/**/*.LEGAL.txt'] // Adjust the path to your compiled files
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

function swaggerDocs(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.get('/', (_req, res) => {
    res.redirect('/api/docs');
  });
}

export default swaggerDocs;
