import { logger } from './logger';
// env removed - using process.env directly

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  timestamp?: string;
  environment?: string;
  version?: string;
  responseTime?: number;
}

interface CriticalError {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'application' | 'security' | 'performance';
}

interface AlertConfig {
  enabled: boolean;
  discordWebhook?: string;
  emailRecipients?: string[];
  slackWebhook?: string;
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, Date> = new Map();
  private alertConfig: AlertConfig;

  private constructor() {
    this.alertConfig = {
      enabled: (process.env.NODE_ENV || 'development') === 'production',
      severityThreshold: 'medium',
    };
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  public trackError(
    error: Error,
    context: ErrorContext = {},
    severity: CriticalError['severity'] = 'medium',
    category: CriticalError['category'] = 'application'
  ): void {
    const enrichedContext: ErrorContext = {
      ...context,
      timestamp: context.timestamp || new Date().toISOString(),
      environment: context.environment || process.env.NODE_ENV || 'development',
      version: context.version || process.env.npm_package_version || '0.1.0',
    };

    const criticalError: CriticalError = {
      error,
      context: enrichedContext,
      severity,
      category,
    };

    this.logError(criticalError);
    this.updateErrorStats(error);

    if (this.shouldSendAlert(criticalError)) {
      this.sendAlert(criticalError);
    }
  }

  private logError(criticalError: CriticalError): void {
    const { error, context, severity, category } = criticalError;

    const logData = {
      severity,
      category,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      context,
    };

    switch (severity) {
      case 'critical':
        logger.error(`[CRITICAL] ${category.toUpperCase()}: ${error.message}`, logData);
        break;
      case 'high':
        logger.error(`[HIGH] ${category.toUpperCase()}: ${error.message}`, logData);
        break;
      case 'medium':
        logger.warn(`[MEDIUM] ${category.toUpperCase()}: ${error.message}`, logData);
        break;
      case 'low':
        logger.info(`[LOW] ${category.toUpperCase()}: ${error.message}`, logData);
        break;
    }
  }

  private updateErrorStats(error: Error): void {
    const errorKey = `${error.name}:${error.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    
    this.errorCounts.set(errorKey, currentCount + 1);
    this.lastErrors.set(errorKey, new Date());
  }

  private shouldSendAlert(criticalError: CriticalError): boolean {
    if (!this.alertConfig.enabled) {
      return false;
    }

    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const errorSeverityIndex = severityLevels.indexOf(criticalError.severity);
    const thresholdIndex = severityLevels.indexOf(this.alertConfig.severityThreshold);

    if (errorSeverityIndex < thresholdIndex) {
      return false;
    }

    const errorKey = `${criticalError.error.name}:${criticalError.error.message}`;
    const errorCount = this.errorCounts.get(errorKey) || 0;
    const lastError = this.lastErrors.get(errorKey);

    if (errorCount >= 5 && lastError) {
      const timeDiff = Date.now() - lastError.getTime();
      if (timeDiff < 5 * 60 * 1000) {
        return false;
      }
    }

    return true;
  }

  private async sendAlert(criticalError: CriticalError): Promise<void> {
    try {
      const alertMessage = this.formatAlertMessage(criticalError);

      if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID) {
        await this.sendDiscordAlert(alertMessage, criticalError);
      }

      logger.info('Error alert sent', {
        severity: criticalError.severity,
        category: criticalError.category,
        errorName: criticalError.error.name,
      });
    } catch (alertError) {
      logger.error('Failed to send error alert', alertError instanceof Error ? alertError : new Error(String(alertError)));
    }
  }

  private formatAlertMessage(criticalError: CriticalError): string {
    const { error, context, severity, category } = criticalError;

    let message = `🚨 **${severity.toUpperCase()} ${category.toUpperCase()} ERROR**\n\n`;
    message += `**Error**: ${error.name}\n`;
    message += `**Message**: ${error.message}\n`;
    message += `**Time**: ${context.timestamp}\n`;
    message += `**Environment**: ${context.environment}\n`;
    
    if (context.url) {
      message += `**URL**: ${context.method} ${context.url}\n`;
    }
    
    if (context.userId) {
      message += `**User**: ${context.userId}\n`;
    }
    
    if (context.ip) {
      message += `**IP**: ${context.ip}\n`;
    }

    const errorKey = `${error.name}:${error.message}`;
    const errorCount = this.errorCounts.get(errorKey) || 1;
    
    if (errorCount > 1) {
      message += `**Occurrences**: ${errorCount}\n`;
    }

    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5);
      message += `\n**Stack Trace**:\n\`\`\`\n${stackLines.join('\n')}\n\`\`\``;
    }

    return message;
  }

  private async sendDiscordAlert(message: string, criticalError: CriticalError): Promise<void> {
    try {
      const discordMessage = {
        embeds: [
          {
            title: `${criticalError.severity.toUpperCase()} Error Alert`,
            description: message,
            color: this.getSeverityColor(criticalError.severity),
            timestamp: new Date().toISOString(),
            footer: {
              text: `CubicJ Cafe - ${process.env.NODE_ENV || 'development'}`,
            },
          },
        ],
      };

      const response = await fetch(`https://discord.com/api/v10/channels/${process.env.DISCORD_CHANNEL_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Failed to send Discord alert', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private getSeverityColor(severity: string): number {
    switch (severity) {
      case 'critical': return 0xFF0000;
      case 'high': return 0xFF6600;
      case 'medium': return 0xFFCC00;
      case 'low': return 0x00FF00;
      default: return 0x808080;
    }
  }

  public getErrorStats(): { errorCounts: Map<string, number>; lastErrors: Map<string, Date> } {
    return {
      errorCounts: new Map(this.errorCounts),
      lastErrors: new Map(this.lastErrors),
    };
  }

  public clearErrorStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
    logger.info('Error statistics cleared');
  }

  public configureAlerts(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    logger.info('Alert configuration updated', this.alertConfig);
  }
}

export const errorTracker = ErrorTracker.getInstance();

export function withErrorTracking<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context: ErrorContext = {},
  severity: CriticalError['severity'] = 'medium',
  category: CriticalError['category'] = 'application'
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      if (result && typeof result === 'object' && 'catch' in result && typeof (result as Record<string, unknown>).catch === 'function') {
        return (result as Promise<unknown>).catch((error: Error) => {
          errorTracker.trackError(error, context, severity, category);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      errorTracker.trackError(
        error instanceof Error ? error : new Error(String(error)),
        context,
        severity,
        category
      );
      throw error;
    }
  }) as T;
}

export default errorTracker;