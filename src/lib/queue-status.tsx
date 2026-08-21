import {
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { BADGE_TONES } from '@/lib/badge-palette';

type QueueStatusType =
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
    bgClass: BADGE_TONES.yellow,
    badgeClass: BADGE_TONES.yellow,
    accentClass: 'text-yellow-600',
  },
  PROCESSING: {
    text: '처리중',
    icon: Play,
    badgeVariant: 'default',
    bgClass: BADGE_TONES.blue,
    badgeClass: BADGE_TONES.blue,
    accentClass: 'text-blue-600',
  },
  COMPLETED: {
    text: '완료',
    icon: CheckCircle,
    badgeVariant: 'outline',
    bgClass: BADGE_TONES.green,
    badgeClass: BADGE_TONES.green,
    accentClass: 'text-green-600',
  },
  COMPLETED_WITH_ERROR: {
    text: '전송 실패',
    icon: AlertTriangle,
    badgeVariant: 'destructive',
    bgClass: BADGE_TONES.orange,
    badgeClass: BADGE_TONES.orange,
    accentClass: 'text-orange-600',
  },
  FAILED: {
    text: '실패',
    icon: XCircle,
    badgeVariant: 'destructive',
    bgClass: BADGE_TONES.red,
    badgeClass: BADGE_TONES.red,
    accentClass: 'text-red-600',
  },
  CANCELLED: {
    text: '취소됨',
    icon: AlertCircle,
    badgeVariant: 'outline',
    bgClass: BADGE_TONES.gray,
    badgeClass: BADGE_TONES.gray,
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
