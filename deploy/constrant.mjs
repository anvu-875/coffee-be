/**
 * List of external dependencies to include in the final build.
 */
export const externalDeps = ['swagger-ui-express', '@prisma/client'];

/**
 * File name for the generated Swagger API specification JSON file.
 */
export const swaggerJSON = 'api-spec.json';

/**
 * List of runtime directories to keep in the final build.
 */
export const keepList = ['dist', 'prisma', 'public', swaggerJSON];
