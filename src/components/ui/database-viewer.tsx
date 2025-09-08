'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';

interface Table {
  name: string;
  displayName: string;
  count: number;
}

interface DatabaseData {
  data: Record<string, unknown>[];
  totalCount: number;
  page: number;
  totalPages: number;
  limit: number;
}

interface DatabaseViewerProps {
  className?: string;
}

export default function DatabaseViewer({ className }: DatabaseViewerProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/admin/db');
      if (!response.ok) {
        throw new Error('테이블 목록 조회 실패');
      }
      const data = await response.json();
      setTables(data.tables);
    } catch {
      setError('테이블 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string, page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/db?table=${tableName}&page=${page}&limit=25`);
      if (!response.ok) {
        throw new Error('테이블 데이터 조회 실패');
      }
      const data = await response.json();
      setTableData(data);
      setCurrentPage(page);
    } catch {
      setError('테이블 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    fetchTableData(tableName, 1);
  };

  const handlePageChange = (page: number) => {
    if (selectedTable) {
      fetchTableData(selectedTable, page);
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '(null)';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))) {
      return new Date(value).toLocaleString('ko-KR');
    }
    return String(value);
  };

  const getColumnDisplayName = (key: string): string => {
    const columnNames: Record<string, string> = {
      id: 'ID',
      discordId: 'Discord ID',
      discordUsername: 'Discord 사용자명',
      nickname: '닉네임',
      avatar: '아바타',
      createdAt: '생성일',
      lastLoginAt: '마지막 로그인',
      updatedAt: '수정일',
      userId: '사용자 ID',
      expiresAt: '만료일',
      status: '상태',
      prompt: '프롬프트',
      imageFile: '이미지 파일',
      lora: 'LoRA',
      loraStrength: 'LoRA 강도',
      loraPresetData: 'LoRA 프리셋 데이터',
      isNSFW: 'NSFW',
      jobId: '작업 ID',
      position: '위치',
      startedAt: '시작일',
      completedAt: '완료일',
      failedAt: '실패일',
      error: '오류',
      imageData: '이미지 데이터',
      name: '이름',
      isDefault: '기본값',
      isPublic: '공개',
      presetId: '프리셋 ID',
      loraFilename: 'LoRA 파일명',
      loraName: 'LoRA 이름',
      strength: '강도',
      group: '그룹',
      order: '순서',
      _count: '개수',
      user: '사용자',
      preset: '프리셋',
    };
    return columnNames[key] || key;
  };

  useEffect(() => {
    fetchTables();
  }, []);

  if (loading && !tables.length) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Database className="w-8 h-8 mx-auto mb-2 animate-spin" />
        <p>데이터베이스 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedTable ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Database className="w-4 h-4 mr-2" />
              데이터베이스 테이블
            </CardTitle>
            <CardDescription className="text-sm">
              조회할 테이블을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <Card 
                  key={table.name} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTableSelect(table.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{table.displayName}</h3>
                        <p className="text-xs text-muted-foreground">{table.name}</p>
                      </div>
                      <Badge variant="secondary">{table.count}개</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-lg">
                  <Database className="w-4 h-4 mr-2" />
                  {tables.find(t => t.name === selectedTable)?.displayName} 테이블
                </CardTitle>
                <CardDescription className="text-sm">
                  총 {tableData?.totalCount}개 레코드 중 {currentPage}페이지
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedTable(null)}
              >
                테이블 목록으로
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Database className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>데이터 로딩 중...</p>
              </div>
            ) : tableData && tableData.data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-muted">
                        {Object.keys(tableData.data[0]).map((key) => (
                          <th key={key} className="border border-gray-200 p-2 text-left text-sm font-medium">
                            {getColumnDisplayName(key)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.data.map((row, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          {Object.entries(row).map(([key, value]) => (
                            <td key={key} className="border border-gray-200 p-2 text-sm max-w-xs">
                              <div className="truncate" title={formatValue(value)}>
                                {formatValue(value)}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {tableData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      {((currentPage - 1) * tableData.limit) + 1}-{Math.min(currentPage * tableData.limit, tableData.totalCount)} / {tableData.totalCount}개
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        이전
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, tableData.totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, currentPage - 2) + i;
                          if (pageNum > tableData.totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= tableData.totalPages}
                      >
                        다음
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                데이터가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}