// env removed - using process.env directly

interface LoggerConfig {
  level: string;
  logDir: string;
  maxFiles: string;
  maxSize: string;
  environment: string;
}

interface WinstonLogger {
  info: (message: string, meta?: object) => void;
  warn: (message: string, meta?: object) => void;
  error: (message: string, meta?: object) => void;
  debug: (message: string, meta?: object) => void;
  verbose: (message: string, meta?: object) => void;
  http: (message: string, meta?: object) => void;
}


// Edge Runtime 체크
const isEdgeRuntime = typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis;

class Logger {
  private static instance: Logger;
  private logger: WinstonLogger | Console = console;
  private config: LoggerConfig;

  private constructor() {
    this.config = {
      level: process.env.LOG_LEVEL || 'info',
      logDir: process.env.LOG_DIR || './logs',
      maxFiles: '14d',
      maxSize: '20m',
      environment: process.env.NODE_ENV || 'development' || 'development',
    };

    this.initLogger();
  }

  private async initLogger(): Promise<void> {
    this.logger = await this.createLogger();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async createLogger(): Promise<{
    info: (message: string, meta?: object) => void;
    warn: (message: string, meta?: object) => void;
    error: (message: string, meta?: object) => void;
    debug: (message: string, meta?: object) => void;
    verbose: (message: string, meta?: object) => void;
    http: (message: string, meta?: object) => void;
  }> {
    // Edge Runtime에서는 console 로거 사용
    if (isEdgeRuntime || typeof window !== 'undefined') {
      return {
        info: (message: string, meta?: object) => console.log(`[INFO] ${message}`, meta),
        warn: (message: string, meta?: object) => console.warn(`[WARN] ${message}`, meta),
        error: (message: string, meta?: object) => console.error(`[ERROR] ${message}`, meta),
        debug: (message: string, meta?: object) => console.debug(`[DEBUG] ${message}`, meta),
        verbose: (message: string, meta?: object) => console.log(`[VERBOSE] ${message}`, meta),
        http: (message: string, meta?: object) => console.log(`[HTTP] ${message}`, meta),
      };
    }

    // Node.js 런타임에서만 Winston 사용
    try {
      const { default: winston } = await import('winston');
      const { default: DailyRotateFile } = await import('winston-daily-rotate-file');
      const { join } = await import('path');

      const formats = [
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ];

      if (this.config.environment === 'development') {
        formats.push(
          winston.format.colorize(),
          winston.format.simple()
        );
      }

      const transports: unknown[] = [];

      if (this.config.environment === 'development') {
        transports.push(
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.printf((info: Record<string, unknown>) => {
                const { timestamp, level, message, stack } = info;
                return `${timestamp} [${level}]: ${stack || message}`;
              })
            ),
          })
        );
      }

      transports.push(
        new DailyRotateFile({
          filename: join(this.config.logDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.config.maxFiles,
          maxSize: this.config.maxSize,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );

      transports.push(
        new DailyRotateFile({
          level: 'error',
          filename: join(this.config.logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.config.maxFiles,
          maxSize: this.config.maxSize,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );

      return winston.createLogger({
        level: this.config.level,
        format: winston.format.combine(...formats),
        transports: transports as never[],
        exitOnError: false,
      });
    } catch {
      // Winston 로드 실패 시 console fallback
      return {
        info: (message: string, meta?: object) => console.log(`[INFO] ${message}`, meta),
        warn: (message: string, meta?: object) => console.warn(`[WARN] ${message}`, meta),
        error: (message: string, meta?: object) => console.error(`[ERROR] ${message}`, meta),
        debug: (message: string, meta?: object) => console.debug(`[DEBUG] ${message}`, meta),
        verbose: (message: string, meta?: object) => console.log(`[VERBOSE] ${message}`, meta),
        http: (message: string, meta?: object) => console.log(`[HTTP] ${message}`, meta),
      };
    }
  }

  public info(message: string, meta?: object): void {
    this.logger.info(message, meta);
  }

  public warn(message: string, meta?: object): void {
    this.logger.warn(message, meta);
  }

  public error(message: string, error?: Error | object): void {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
    } else {
      this.logger.error(message, error);
    }
  }

  public debug(message: string, meta?: object): void {
    if ('debug' in this.logger) {
      this.logger.debug(message, meta);
    } else {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  }

  public verbose(message: string, meta?: object): void {
    if ('verbose' in this.logger) {
      this.logger.verbose(message, meta);
    } else {
      console.log(`[VERBOSE] ${message}`, meta);
    }
  }

  public http(message: string, meta?: object): void {
    if ('http' in this.logger) {
      this.logger.http(message, meta);
    } else {
      console.log(`[HTTP] ${message}`, meta);
    }
  }

  public logApiRequest(req: {
    method: string;
    url: string;
    ip?: string;
    userAgent?: string;
  }): void {
    this.http('API Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  public logApiResponse(
    req: { method: string; url: string },
    res: { statusCode: number },
    responseTime: number
  ): void {
    this.http('API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  public logError(error: Error, context?: string): void {
    this.error(`${context ? `[${context}] ` : ''}${error.message}`, error);
  }

  public logDiscordEvent(event: string, data?: object): void {
    this.info(`Discord Event: ${event}`, data);
  }

  public logComfyUIEvent(event: string, data?: object): void {
    this.info(`ComfyUI Event: ${event}`, data);
  }

  public logGenerationEvent(event: string, data?: object): void {
    this.info(`Generation Event: ${event}`, data);
  }

  public logSystemMetrics(metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    loadAverage?: number[];
    diskUsage?: { used: number; total: number };
  }): void {
    this.info('System Metrics', {
      memory: {
        rss: `${Math.round(metrics.memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(metrics.memoryUsage.external / 1024 / 1024)}MB`,
      },
      uptime: `${Math.round(metrics.uptime / 60)}min`,
      loadAverage: metrics.loadAverage,
      diskUsage: metrics.diskUsage ? {
        used: `${Math.round(metrics.diskUsage.used / 1024 / 1024 / 1024)}GB`,
        total: `${Math.round(metrics.diskUsage.total / 1024 / 1024 / 1024)}GB`,
        percentage: `${Math.round((metrics.diskUsage.used / metrics.diskUsage.total) * 100)}%`,
      } : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

export const logger = Logger.getInstance();

export function createRequestLogger() {
  return (req: { method: string; url: string; ip?: string; connection?: { remoteAddress: string }; get: (header: string) => string }, res: { statusCode: number; on: (event: string, callback: () => void) => void }, next?: () => void) => {
    const start = Date.now();
    
    logger.logApiRequest({
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
    });

    res.on('finish', () => {
      const responseTime = Date.now() - start;
      logger.logApiResponse(req, res, responseTime);
    });

    if (next) next();
  };
}

export default logger;