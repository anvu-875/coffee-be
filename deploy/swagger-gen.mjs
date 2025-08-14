import 'dotenv/config';
import YAML from 'yaml';
import swaggerJSDoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { PROD_DIR, SWAGGER_JSON, SWAGGER_YAML } from './constrant.mjs';

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

const outDir = path.resolve(process.cwd(), PROD_DIR);

fs.writeFileSync(
  path.resolve(outDir, SWAGGER_JSON),
  JSON.stringify(swaggerSpec, null, 2)
);

fs.writeFileSync(
  path.resolve(outDir, SWAGGER_YAML),
  YAML.stringify(swaggerSpec, { indent: 2 })
);

console.log(`✅ API specification generated`);
