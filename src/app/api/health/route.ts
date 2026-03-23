import { NextResponse } from 'next/server';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { createRouteHandler, AuthenticatedRequest } from '@/lib/api/route-handler';
import { isAdmin } from '@/lib/auth/admin';
import fs from 'fs/promises';

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

async function checkComfyUIService(): Promise<ServiceStatus> {
  if (!isComfyUIEnabled()) {
    return {
      status: 'unknown' as const,
      lastCheck: new Date().toISOString(),
      error: 'ComfyUI disabled by admin',
    };
  }
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
      return { status: 'healthy', responseTime, lastCheck: new Date().toISOString() };
    } else {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: `HTTP ${response.status}`,
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

    return { status: 'healthy', responseTime: Date.now() - start, lastCheck: new Date().toISOString() };
  } catch {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: 'Database file not accessible',
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
      headers: { 'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - start;

    if (response.ok) {
      return { status: 'healthy', responseTime, lastCheck: new Date().toISOString() };
    } else {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: `HTTP ${response.status}`,
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

    return { status: 'healthy', responseTime: Date.now() - start, lastCheck: new Date().toISOString() };
  } catch {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: 'Filesystem error',
    };
  }
}

export const GET = createRouteHandler(
  { auth: 'optional' },
  async (req: AuthenticatedRequest) => {
    const startTime = Date.now();

    const admin = !!req.user?.discordId && isAdmin(req.user.discordId);

    const [comfyui, database, discord, filesystem] = await Promise.all([
      checkComfyUIService(),
      checkDatabaseService(),
      checkDiscordService(),
      checkFilesystemService(),
    ]);

    const services = { database, comfyui, discord, filesystem };

    const servicesHealthy = Object.values(services).filter(s => s.status === 'healthy').length;
    const totalServices = Object.values(services).length;

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (servicesHealthy === 0) {
      overallStatus = 'unhealthy';
    } else if (servicesHealthy < totalServices) {
      overallStatus = 'degraded';
    }

    const responseTime = Date.now() - startTime;
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

    const publicResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      services: Object.fromEntries(
        Object.entries(services).map(([key, val]) => [key, { status: val.status }])
      ),
      performance: { responseTime },
    };

    if (!admin) {
      return NextResponse.json(publicResponse, { status: statusCode });
    }

    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      ...publicResponse,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services,
      system: {
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          memoryUsage,
        },
      },
    }, { status: statusCode });
  }
);
