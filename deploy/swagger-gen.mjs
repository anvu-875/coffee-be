import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerJSON } from './constrant.mjs';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coffee Shop API',
      version: '1.0.0',
      description: 'API documentation for the Coffee Shop backend'
    },
    servers: [
      {
        url: `${process.env.URL}/api`
      }
    ]
  },
  apis: ['src/routes/**/*.ts', 'src/schemas/**/*.ts']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

fs.writeFileSync(
  path.resolve(process.cwd(), swaggerJSON),
  JSON.stringify(swaggerSpec, null, 2)
);

console.log(`✅ ${swaggerJSON} generated`);
