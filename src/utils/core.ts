import path from 'path';

const utils = {
  rootDir: path.join(path.dirname(require.main?.filename!), '..'),
  // require.main is an object that holds information about the root (main) module of the Node.js application.
  // filename is a property of require.main that contains the path to the main JavaScript file being executed.
  // Using ?. is the optional chaining operator to safely check if require.main exists before accessing filename.
  mainDir: path.dirname(require.main?.filename!),
};

export default utils;
