import chalk, { type ChalkInstance } from 'chalk';

// Log levels configuration
const logLevels = ['error', 'warn', 'info', 'verbose', 'debug'] as const;

// Define the log level with colors and priorities
type LogLevel = (typeof logLevels)[number];
type LogLevels = Record<LogLevel, { color: ChalkInstance; priority: number }>;

const levels: LogLevels = {
  error: { color: chalk.red, priority: 0 },
  warn: { color: chalk.yellow, priority: 1 },
  info: { color: chalk.green, priority: 2 },
  verbose: { color: chalk.cyan, priority: 3 },
  debug: { color: chalk.blue, priority: 4 },
};

// Current log level (debug captures all levels)
const currentLevel = 'debug';

// Show timestamps in logs (true for timestamps, false for cleaner output)
const showTimestamp = false;

// Custom logger function
const logger = {
  log: (level: LogLevel, ...message: unknown[]) => {
    if (levels[level].priority <= levels[currentLevel].priority) {
      const timestamp = showTimestamp ? new Date().toUTCString() + ' ' : '';
      const formattedMessage = `${timestamp}[${level.toUpperCase()}]: ${message}`;
      console.log(levels[level].color(formattedMessage));
    }
  },
  error: (...message: unknown[]) => logger.log('error', message),
  warn: (...message: unknown[]) => logger.log('warn', message),
  info: (...message: unknown[]) => logger.log('info', message),
  verbose: (...message: unknown[]) => logger.log('verbose', message),
  debug: (...message: unknown[]) => logger.log('debug', message),
};

export default logger;
