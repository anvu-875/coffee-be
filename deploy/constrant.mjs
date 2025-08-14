/**
 * List of external dependencies to include in the final build.
 */
export const EXTERNAL_DEPS = [
  'swagger-ui-express',
  'express',
  '@prisma/client'
];

/**
 * Directory for the production build.
 */
export const PROD_DIR = 'dist';

/**
 * File name for the generated Swagger API specification JSON file.
 */
export const SWAGGER_JSON = 'api-spec.json';

/**
 * File name for the generated Swagger API specification YAML file.
 */
export const SWAGGER_YAML = 'api-spec.yaml';

/**
 * List of runtime directories to keep in the final build.
 */
export const KEEP_LIST = [PROD_DIR, 'prisma', 'public'];

/**
 * Configuration for the production package.json file.
 */
export const PRODUCTION_PACKAGE_JSON = {
  scripts: {
    start: 'node dist/index.js'
  }
};
