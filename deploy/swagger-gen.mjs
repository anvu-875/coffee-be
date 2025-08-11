import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

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

export const fileName = 'swagger-docs.json';

fs.writeFileSync(
  path.resolve(process.cwd(), fileName),
  JSON.stringify(swaggerSpec, null, 2)
);

console.log(`✅ ${fileName} generated`);
