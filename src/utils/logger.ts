import chalk, { type ChalkInstance } from 'chalk';

// Log levels configuration
type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';
type LogLevels = Record<LogLevel, { color: ChalkInstance; priority: number }>;

const levels: LogLevels = {
  error: { color: chalk.red, priority: 0 },
  warn: { color: chalk.yellow, priority: 1 },
  info: { color: chalk.green, priority: 2 },
  verbose: { color: chalk.cyan, priority: 3 },
  debug: { color: chalk.blue, priority: 4 }
};

// Current log level (debug captures all levels)
const currentLevel = 'debug';

// Show timestamps in logs (true for timestamps, false for cleaner output)
const showTimestamp = true;

// Format timestamp for logs
const formatTimestamp = () => {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const datePart = `${parts.find((p) => p.type === 'day')?.value}/${parts.find((p) => p.type === 'month')?.value}/${
    parts.find((p) => p.type === 'year')?.value
  }`;
  const timePart = `${parts.find((p) => p.type === 'hour')?.value}:${parts.find((p) => p.type === 'minute')?.value}:${
    parts.find((p) => p.type === 'second')?.value
  }`;
  return `[${datePart} ${timePart} GMT]`;
};

// Custom logger function
const logger = {
  log: (level: LogLevel, ...message: unknown[]) => {
    if (levels[level].priority <= levels[currentLevel].priority) {
      const timestamp = showTimestamp ? formatTimestamp() + ' ' : '';
      const formattedMessage = `${timestamp}[${level.toUpperCase()}]:`;
      console.log(levels[level].color(formattedMessage, message));
    }
  },
  error: (...message: unknown[]) => logger.log('error', message),
  warn: (...message: unknown[]) => logger.log('warn', message),
  info: (...message: unknown[]) => logger.log('info', message),
  verbose: (...message: unknown[]) => logger.log('verbose', message),
  debug: (...message: unknown[]) => logger.log('debug', message)
};

export default logger;
