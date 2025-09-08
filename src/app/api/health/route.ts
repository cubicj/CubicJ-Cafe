import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    comfyui: ServiceStatus;
    discord: ServiceStatus;
    filesystem: ServiceStatus;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      free: number;
      total: number;
      percentage: number;
    };
    process: {
      pid: number;
      uptime: number;
      memoryUsage: NodeJS.MemoryUsage;
    };
  };
  performance: {
    responseTime: number;
    lastCheck: string;
  };
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

async function checkComfyUIService(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${process.env.COMFYUI_API_URL || 'http://localhost:8188'}/system_stats`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - start;
    
    if (response.ok) {
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } else {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkDatabaseService(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const dbPath = (process.env.DATABASE_URL || '').replace('file:', '');
    await fs.access(dbPath);
    
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database file not accessible',
    };
  }
}

async function checkDiscordService(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    if (!process.env.DISCORD_BOT_TOKEN) {
      return {
        status: 'unknown',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: 'Discord bot token not configured',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://discord.com/api/v10/gateway', {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const responseTime = Date.now() - start;

    if (response.ok) {
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } else {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Discord API error',
    };
  }
}

async function checkFilesystemService(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const tempDir = process.env.UPLOAD_TEMP_DIR || './public/temp';
    await fs.access(tempDir);
    
    const stats = await fs.stat(tempDir);
    if (!stats.isDirectory()) {
      throw new Error('Temp directory is not a directory');
    }

    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Filesystem error',
    };
  }
}

async function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  const stats = {
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    },
    disk: {
      used: 0,
      free: 0,
      total: 0,
      percentage: 0,
    },
    process: {
      pid: process.pid,
      uptime: uptime,
      memoryUsage: memoryUsage,
    },
  };

  try {
    const diskStats = await fs.stat('./');
    stats.disk = {
      used: diskStats.size || 0,
      free: 0,
      total: diskStats.size || 0,
      percentage: 0,
    };
  } catch (error) {
    logger.warn('Failed to get disk statistics', { error: error instanceof Error ? error.message : error });
  }

  return stats;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logger.info('Health check requested', {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    const [comfyui, database, discord, filesystem, systemMetrics] = await Promise.all([
      checkComfyUIService(),
      checkDatabaseService(),
      checkDiscordService(),
      checkFilesystemService(),
      getSystemMetrics(),
    ]);

    const services = {
      database,
      comfyui,
      discord,
      filesystem,
    };

    const servicesHealthy = Object.values(services).filter(s => s.status === 'healthy').length;
    const totalServices = Object.values(services).length;
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (servicesHealthy === 0) {
      overallStatus = 'unhealthy';
    } else if (servicesHealthy < totalServices) {
      overallStatus = 'degraded';
    }

    const responseTime = Date.now() - startTime;

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development' || 'development',
      services,
      system: systemMetrics,
      performance: {
        responseTime,
        lastCheck: new Date().toISOString(),
      },
    };

    logger.logSystemMetrics({
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    });

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)));

    const errorResponse: Partial<HealthCheck> = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development' || 'development',
      performance: {
        responseTime,
        lastCheck: new Date().toISOString(),
      },
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}