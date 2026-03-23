'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Table {
  name: string;
  displayName: string;
  count: number;
}

export interface DatabaseData {
  data: Record<string, unknown>[];
  totalCount: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface SortState {
  orderBy: string | null;
  orderDirection: 'asc' | 'desc';
}

interface UseDatabaseTableOptions {
  pageSize?: number;
}

export function useDatabaseTable({ pageSize = 25 }: UseDatabaseTableOptions = {}) {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ orderBy: null, orderDirection: 'desc' });

  const fetchTables = useCallback(async () => {
    try {
      const data = await apiClient.get<{ tables: Table[] }>('/api/admin/db');
      setTables(data.tables);
    } catch {
      setError('테이블 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTableData = useCallback(async (
    tableName: string,
    page: number = 1,
    sortBy?: string,
    sortDirection?: 'asc' | 'desc'
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        table: tableName,
        page: page.toString(),
        limit: pageSize.toString()
      });

      const effectiveOrderBy = sortBy ?? sort.orderBy;
      const effectiveDirection = sortDirection ?? sort.orderDirection;

      if (effectiveOrderBy) {
        params.append('orderBy', effectiveOrderBy);
        params.append('orderDirection', effectiveDirection);
      }

      const data = await apiClient.get<DatabaseData>(`/api/admin/db?${params.toString()}`);
      setTableData(data);
      setCurrentPage(page);
      setExpandedItems(new Set());
    } catch {
      setError('테이블 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [pageSize, sort.orderBy, sort.orderDirection]);

  const selectTable = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    setSort({ orderBy: null, orderDirection: 'desc' });
    fetchTableData(tableName, 1);
  }, [fetchTableData]);

  const goToPage = useCallback((page: number) => {
    if (selectedTable) {
      fetchTableData(selectedTable, page);
    }
  }, [selectedTable, fetchTableData]);

  const toggleSort = useCallback((field: string) => {
    if (!selectedTable) return;

    const newDirection: 'asc' | 'desc' =
      sort.orderBy === field && sort.orderDirection === 'desc' ? 'asc' : 'desc';

    setSort({ orderBy: field, orderDirection: newDirection });
    setCurrentPage(1);
    fetchTableData(selectedTable, 1, field, newDirection);
  }, [selectedTable, sort, fetchTableData]);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setSelectedTable(null);
    setTableData(null);
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    selectedTable,
    tableData,
    loading,
    error,
    currentPage,
    expandedItems,
    sort,
    selectTable,
    goToPage,
    toggleSort,
    toggleExpanded,
    goBack,
  };
}
