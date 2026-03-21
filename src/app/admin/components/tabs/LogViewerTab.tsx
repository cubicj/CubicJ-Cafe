'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { enableClientLogTransport, disableClientLogTransport } from '@/lib/logger';
import {
  Play,
  Pause,
  Trash2,
  History,
  Radio,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  source?: 'server' | 'client';
  meta?: Record<string, unknown>;
}

const LEVELS = ['all', 'error', 'warn', 'info', 'debug'] as const;
const CATEGORIES = [
  'system', 'auth', 'api', 'queue', 'comfyui', 'discord', 'admin', 'database',
  'hook', 'ui', 'page', 'generate',
] as const;

const MAX_ENTRIES = 500;

function getLevelColor(level: string): string {
  switch (level) {
    case 'error':
      return 'text-red-500';
    case 'warn':
      return 'text-yellow-500';
    case 'debug':
      return 'text-muted-foreground';
    default:
      return '';
  }
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function LogEntryRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const levelColor = getLevelColor(entry.level);

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 px-2 py-0.5"
      onClick={() => entry.meta && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-1 font-mono text-sm">
        <span className="text-muted-foreground shrink-0">
          {formatTime(entry.timestamp)}
        </span>
        <span className={`shrink-0 text-xs font-bold ${entry.source === 'client' ? 'text-blue-400' : 'text-green-400'}`}>
          [{entry.source === 'client' ? 'C' : 'S'}]
        </span>
        <span className={`shrink-0 uppercase font-semibold ${levelColor}`}>
          [{entry.level}]
        </span>
        <span className="shrink-0 text-muted-foreground">
          [{entry.category}]
        </span>
        <span className={`truncate ${levelColor}`}>{entry.message}</span>
        {entry.meta && (
          <span className="shrink-0 ml-auto">
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
      {expanded && entry.meta && (
        <pre className="text-xs text-muted-foreground ml-20 mt-1 mb-1 p-2 bg-muted rounded overflow-x-auto">
          {JSON.stringify(entry.meta, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function LogViewerTab() {
  const [mode, setMode] = useState<'realtime' | 'history'>('realtime');
  const [level, setLevel] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [clientCapture, setClientCapture] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'server' | 'client'>('all');

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [historyDate, setHistoryDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [historyEntries, setHistoryEntries] = useState<LogEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    return () => {
      disableClientLogTransport();
    };
  }, []);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams();
    if (level !== 'all') params.set('level', level);
    if (selectedCategories.length > 0)
      params.set('category', selectedCategories.join(','));

    const url = `/api/admin/logs/stream${params.toString() ? `?${params}` : ''}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    es.onmessage = (event) => {
      try {
        const entry: LogEntry = JSON.parse(event.data);
        setEntries((prev) => {
          const next = [...prev, entry];
          return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next;
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      setConnected(false);
      reconnectTimerRef.current = setTimeout(() => {
        connectSSE();
      }, 3000);
    };
  }, [level, selectedCategories]);

  useEffect(() => {
    if (mode !== 'realtime') return;

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [mode, connectSSE]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredEntries = entries.filter((e) => {
    if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
    if (search && !e.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fetchHistory = useCallback(
    async (page: number) => {
      setHistoryLoading(true);
      try {
        const params = new URLSearchParams({
          date: historyDate,
          page: String(page),
          limit: '100',
        });
        if (level !== 'all') params.set('level', level);
        if (selectedCategories.length > 0)
          params.set('category', selectedCategories.join(','));
        if (search) params.set('search', search);

        const res = await fetch(`/api/admin/logs?${params}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        setHistoryEntries(data.entries || []);
        setHistoryTotal(data.total || 0);
        setHistoryPage(page);
      } catch {
        setHistoryEntries([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyDate, level, selectedCategories, search]
  );

  useEffect(() => {
    if (mode === 'history') {
      fetchHistory(1);
    }
  }, [mode, fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(historyTotal / 100));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">로그 뷰어</CardTitle>
          <div className="flex items-center gap-2">
            {mode === 'realtime' && (
              <Badge variant={connected ? 'default' : 'destructive'}>
                {connected ? '연결됨' : '연결 끊김'}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMode((m) => (m === 'realtime' ? 'history' : 'realtime'));
              }}
            >
              {mode === 'realtime' ? (
                <>
                  <History className="w-4 h-4 mr-1" />
                  히스토리
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 mr-1" />
                  실시간
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l === 'all' ? 'All Levels' : l.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={
                  selectedCategories.includes(cat) ? 'default' : 'outline'
                }
                className="cursor-pointer select-none"
                onClick={() => toggleCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          <Input
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[180px]"
          />

          <div className="flex items-center gap-2 border-l pl-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Client Capture</label>
            <Switch
              checked={clientCapture}
              onCheckedChange={(checked) => {
                setClientCapture(checked);
                if (checked) {
                  enableClientLogTransport();
                } else {
                  disableClientLogTransport();
                }
              }}
            />
          </div>

          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as 'all' | 'server' | 'client')}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="server">Server</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>

          {mode === 'realtime' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoScroll((v) => !v)}
              >
                {autoScroll ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEntries([])}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}

          {mode === 'history' && (
            <Input
              type="date"
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              className="w-[160px]"
            />
          )}
        </div>

        {mode === 'realtime' ? (
          <div
            ref={scrollRef}
            className="h-[600px] overflow-y-auto border rounded bg-background font-mono text-sm"
          >
            {filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                로그 대기 중...
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <LogEntryRow key={entry.id} entry={entry} />
              ))
            )}
          </div>
        ) : (
          <>
            <div className="h-[600px] overflow-y-auto border rounded bg-background font-mono text-sm">
              {historyLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  로딩 중...
                </div>
              ) : historyEntries.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  로그 없음
                </div>
              ) : (
                historyEntries.map((entry) => (
                  <LogEntryRow key={entry.id} entry={entry} />
                ))
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                총 {historyTotal}건
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage <= 1}
                  onClick={() => fetchHistory(historyPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  {historyPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage >= totalPages}
                  onClick={() => fetchHistory(historyPage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
