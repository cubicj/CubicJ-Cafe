import {
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export type QueueStatusType =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERROR'
  | 'FAILED'
  | 'CANCELLED';

interface StatusConfig {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  bgClass: string;
  badgeClass: string;
  accentClass: string;
}

const STATUS_CONFIG: Record<QueueStatusType, StatusConfig> = {
  PENDING: {
    text: '대기중',
    icon: Clock,
    badgeVariant: 'secondary',
    bgClass: 'bg-yellow-100 text-yellow-800',
    badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    accentClass: 'text-yellow-600',
  },
  PROCESSING: {
    text: '처리중',
    icon: Play,
    badgeVariant: 'default',
    bgClass: 'bg-blue-100 text-blue-800',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
    accentClass: 'text-blue-600',
  },
  COMPLETED: {
    text: '완료',
    icon: CheckCircle,
    badgeVariant: 'outline',
    bgClass: 'bg-green-100 text-green-800',
    badgeClass: 'bg-green-100 text-green-700 border-green-300',
    accentClass: 'text-green-600',
  },
  COMPLETED_WITH_ERROR: {
    text: '전송 실패',
    icon: AlertTriangle,
    badgeVariant: 'destructive',
    bgClass: 'bg-orange-100 text-orange-800',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-300',
    accentClass: 'text-orange-600',
  },
  FAILED: {
    text: '실패',
    icon: XCircle,
    badgeVariant: 'destructive',
    bgClass: 'bg-red-100 text-red-800',
    badgeClass: 'bg-red-100 text-red-700 border-red-300',
    accentClass: 'text-red-600',
  },
  CANCELLED: {
    text: '취소됨',
    icon: AlertCircle,
    badgeVariant: 'outline',
    bgClass: 'bg-gray-100 text-gray-800',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
    accentClass: 'text-gray-600',
  },
};

function getConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status as QueueStatusType] ?? STATUS_CONFIG.PENDING;
}

export function getStatusText(status: string): string {
  return getConfig(status).text;
}

export function getStatusIcon(status: string, className = 'h-4 w-4') {
  const Icon = getConfig(status).icon;
  return <Icon className={className} />;
}

export function getStatusBadgeVariant(status: string) {
  return getConfig(status).badgeVariant;
}

export function getStatusBgColor(status: string): string {
  return getConfig(status).bgClass;
}

export function getStatusBadgeColor(status: string): string {
  return getConfig(status).badgeClass;
}

export function getStatusAccentColor(status: string): string {
  return getConfig(status).accentClass;
}
