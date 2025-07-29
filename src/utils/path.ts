import pathLib from 'path';

const path = {
  // require.main is an object that holds information about the root (main) module of the Node.js application.
  // filename is a property of require.main that contains the path to the main JavaScript file being executed.
  // Using ?. is the optional chaining operator to safely check if require.main exists before accessing filename.
  rootDir: pathLib.join(pathLib.dirname(require.main?.filename!), '..'),
  mainDir: pathLib.dirname(require.main?.filename!),
  publicDir: pathLib.join(pathLib.join(pathLib.dirname(require.main?.filename!), '..'), 'public'),
};

export default path;
