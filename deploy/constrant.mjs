/**
 * List of external dependencies to include in the final build.
 */
export const EXTERNAL_DEPS = [
  'swagger-ui-express',
  'express',
  '@prisma/client'
];

/**
 * List of runtime directories to keep in the final build.
 */
export const KEEP_LIST = ['dist', 'prisma', 'public'];

/**
 * Configuration for the production package.json file.
 */
export const PRODUCTION_PACKAGE_JSON = {
  scripts: {
    start: 'node dist/index.js'
  }
};
