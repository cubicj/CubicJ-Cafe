import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
// env removed - using process.env directly
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface MonitoringData {
  timestamp: string;
  system: {
    uptime: number;
    loadAverage: number[];
    memory: {
      total: number;
      free: number;
      used: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      cores: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    };
  };
  application: {
    version: string;
    environment: string;
    port: number;
    pid: number;
    memory: NodeJS.MemoryUsage;
  };
  services: {
    pm2: PM2Status[];
    nginx: ServiceStatus;
    database: ServiceStatus;
  };
  logs: {
    recent: LogEntry[];
    errors: LogEntry[];
    size: {
      application: number;
      error: number;
      total: number;
    };
  };
  performance: {
    responseTime: number;
    requestCount: number;
    errorRate: number;
  };
}

interface PM2Status {
  name: string;
  pid: number;
  status: string;
  memory: number;
  cpu: number;
  uptime: number;
  restarts: number;
}

interface ServiceStatus {
  status: 'running' | 'stopped' | 'error' | 'unknown';
  pid?: number;
  memory?: number;
  uptime?: number;
  error?: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: object;
}

async function checkPM2Status(): Promise<PM2Status[]> {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout) as Array<{
      name: string;
      pid: number;
      memory: number;
      cpu: number;
      pm2_env?: {
        status: string;
        pm_uptime: number;
        restart_time: number;
      };
    }>;
    
    return processes.map(proc => ({
      name: proc.name,
      pid: proc.pid,
      status: proc.pm2_env?.status || 'unknown',
      memory: Math.round(proc.memory / 1024 / 1024),
      cpu: proc.cpu || 0,
      uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
      restarts: proc.pm2_env?.restart_time || 0,
    }));
  } catch (error) {
    logger.warn('Failed to get PM2 status', { error: error instanceof Error ? error.message : error });
    return [];
  }
}

async function checkNginxStatus(): Promise<ServiceStatus> {
  try {
    const { stdout } = await execAsync('systemctl is-active nginx');
    const status = stdout.trim();
    
    if (status === 'active') {
      const { stdout: statusOutput } = await execAsync('systemctl status nginx --no-pager -l');
      const pidMatch = statusOutput.match(/Main PID: (\d+)/);
      const pid = pidMatch ? parseInt(pidMatch[1]) : undefined;
      
      return {
        status: 'running',
        pid,
      };
    } else {
      return {
        status: 'stopped',
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkDatabaseStatus(): Promise<ServiceStatus> {
  try {
    const dbPath = process.env.DATABASE_URL || ''.replace('file:', '');
    const stats = await fs.stat(dbPath);
    
    return {
      status: 'running',
      memory: Math.round(stats.size / 1024 / 1024),
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database not accessible',
    };
  }
}

async function getSystemMetrics() {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const systemInfo = {
      uptime: uptime,
      loadAverage: [0, 0, 0],
      memory: {
        total: memoryUsage.heapTotal,
        free: memoryUsage.heapTotal - memoryUsage.heapUsed,
        used: memoryUsage.heapUsed,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      cpu: {
        usage: 0,
        cores: 1,
      },
      disk: {
        total: 0,
        used: 0,
        free: 0,
        percentage: 0,
      },
    };

    try {
      const { stdout: memInfo } = await execAsync('free -b');
      const memLines = memInfo.split('\n')[1].split(/\s+/);
      systemInfo.memory = {
        total: parseInt(memLines[1]),
        free: parseInt(memLines[3]),
        used: parseInt(memLines[2]),
        percentage: Math.round((parseInt(memLines[2]) / parseInt(memLines[1])) * 100),
      };
    } catch (error) {
      logger.debug('Failed to get system memory info', { error: error instanceof Error ? error.message : error });
    }

    try {
      const { stdout: diskInfo } = await execAsync('df -B1 .');
      const diskLines = diskInfo.split('\n')[1].split(/\s+/);
      systemInfo.disk = {
        total: parseInt(diskLines[1]),
        used: parseInt(diskLines[2]),
        free: parseInt(diskLines[3]),
        percentage: parseInt(diskLines[4].replace('%', '')),
      };
    } catch (error) {
      logger.debug('Failed to get disk info', { error: error instanceof Error ? error.message : error });
    }

    try {
      const { stdout: cpuInfo } = await execAsync('nproc');
      systemInfo.cpu.cores = parseInt(cpuInfo.trim());
    } catch (error) {
      logger.debug('Failed to get CPU info', { error: error instanceof Error ? error.message : error });
    }

    return systemInfo;
  } catch (error) {
    logger.warn('Failed to get system metrics', { error: error instanceof Error ? error.message : error });
    
    const memoryUsage = process.memoryUsage();
    return {
      uptime: process.uptime(),
      loadAverage: [0, 0, 0],
      memory: {
        total: memoryUsage.heapTotal,
        free: memoryUsage.heapTotal - memoryUsage.heapUsed,
        used: memoryUsage.heapUsed,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      cpu: {
        usage: 0,
        cores: 1,
      },
      disk: {
        total: 0,
        used: 0,
        free: 0,
        percentage: 0,
      },
    };
  }
}

async function getRecentLogs(): Promise<{ recent: LogEntry[]; errors: LogEntry[]; size: { application: number; error: number; total: number } }> {
  try {
    const logDir = process.env.LOG_DIR || './logs';
    const today = new Date().toISOString().split('T')[0];
    const applicationLogPath = path.join(logDir, `application-${today}.log`);
    const errorLogPath = path.join(logDir, `error-${today}.log`);
    
    const recent: LogEntry[] = [];
    const errors: LogEntry[] = [];
    const size = { application: 0, error: 0, total: 0 };

    try {
      const applicationLogContent = await fs.readFile(applicationLogPath, 'utf8');
      const applicationLines = applicationLogContent.split('\n').filter(line => line.trim()).slice(-50);
      
      for (const line of applicationLines) {
        try {
          const logEntry = JSON.parse(line) as LogEntry;
          recent.push(logEntry);
        } catch {
          recent.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
          });
        }
      }
      
      const stats = await fs.stat(applicationLogPath);
      size.application = stats.size;
    } catch (error) {
      logger.debug('Failed to read application log', { error: error instanceof Error ? error.message : error });
    }

    try {
      const errorLogContent = await fs.readFile(errorLogPath, 'utf8');
      const errorLines = errorLogContent.split('\n').filter(line => line.trim()).slice(-20);
      
      for (const line of errorLines) {
        try {
          const logEntry = JSON.parse(line) as LogEntry;
          errors.push(logEntry);
        } catch {
          errors.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: line,
          });
        }
      }
      
      const stats = await fs.stat(errorLogPath);
      size.error = stats.size;
    } catch (error) {
      logger.debug('Failed to read error log', { error: error instanceof Error ? error.message : error });
    }

    size.total = size.application + size.error;

    return { recent, errors, size };
  } catch (error) {
    logger.warn('Failed to get recent logs', { error: error instanceof Error ? error.message : error });
    return {
      recent: [],
      errors: [],
      size: { application: 0, error: 0, total: 0 },
    };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // TODO: 커스텀 세션 인증으로 교체 필요
    // const session = await getServerSession(authOptions);
    // 
    // if (!session?.user) {
    //   logger.warn('Unauthorized monitoring access attempt', {
    //     ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   });
    //   
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    logger.info('Monitoring data requested', {
      user: 'admin', // TODO: 실제 사용자 정보로 교체
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    const [systemMetrics, pm2Status, nginxStatus, databaseStatus, logs] = await Promise.all([
      getSystemMetrics(),
      checkPM2Status(),
      checkNginxStatus(),
      checkDatabaseStatus(),
      getRecentLogs(),
    ]);

    const responseTime = Date.now() - startTime;

    const monitoringData: MonitoringData = {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      application: {
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        port: 6002,
        pid: process.pid,
        memory: process.memoryUsage(),
      },
      services: {
        pm2: pm2Status,
        nginx: nginxStatus,
        database: databaseStatus,
      },
      logs,
      performance: {
        responseTime,
        requestCount: 0,
        errorRate: 0,
      },
    };

    logger.info('Monitoring data collected', {
      user: 'admin', // TODO: 실제 사용자 정보로 교체
      responseTime,
      dataSize: JSON.stringify(monitoringData).length,
    });

    return NextResponse.json(monitoringData);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to collect monitoring data', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { 
        error: 'Failed to collect monitoring data',
        timestamp: new Date().toISOString(),
        responseTime,
      },
      { status: 500 }
    );
  }
}