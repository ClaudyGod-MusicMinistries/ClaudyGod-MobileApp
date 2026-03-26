import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import { env } from '../config/env';

const isDevelopment = env.NODE_ENV === 'development';
const logDirectoryCandidates = [
  process.env.LOG_DIR,
  path.resolve(process.cwd(), 'logs'),
  '/tmp/claudygod-api-logs',
].filter((value): value is string => Boolean(value && value.trim()));

const ensureWritableLogDirectory = (): string | null => {
  for (const directory of logDirectoryCandidates) {
    try {
      fs.mkdirSync(directory, { recursive: true });
      fs.accessSync(directory, fs.constants.W_OK);
      return directory;
    } catch {
      continue;
    }
  }

  return null;
};

const writableLogDirectory = ensureWritableLogDirectory();

const createFileTransport = (
  filename: string,
  options: Omit<winston.transports.FileTransportOptions, 'filename'> = {}
): winston.transport | null => {
  if (!writableLogDirectory) {
    return null;
  }

  try {
    return new winston.transports.File({
      filename: path.join(writableLogDirectory, filename),
      ...options,
    });
  } catch {
    return null;
  }
};

const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf((info: any) => {
        const { level, message, timestamp, requestId, ...meta } = info;
        const requestIdStr = requestId ? ` [${requestId}]` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]${requestIdStr}: ${message}${metaStr}`;
      })
    ),
  }),
];

// File transport in production
if (!isDevelopment) {
  const errorTransport = createFileTransport('error.log', {
    level: 'error',
    format: winston.format.json(),
  });
  const combinedTransport = createFileTransport('combined.log', {
    format: winston.format.json(),
  });

  if (errorTransport) {
    transports.push(errorTransport);
  }

  if (combinedTransport) {
    transports.push(combinedTransport);
  }
}

const exceptionHandlers: winston.transport[] = [];
const exceptionFileTransport = createFileTransport('exceptions.log');

if (exceptionFileTransport) {
  exceptionHandlers.push(exceptionFileTransport);
}

export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat()
  ),
  defaultMeta: { service: 'claudygod-api' },
  transports,
  exceptionHandlers,
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

export type Logger = typeof logger;
