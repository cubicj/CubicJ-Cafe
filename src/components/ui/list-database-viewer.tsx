'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Database, Users, Video, Settings, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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

interface ListDatabaseViewerProps {
  className?: string;
}

export default function ListDatabaseViewer({ className }: ListDatabaseViewerProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

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

  const fetchTableData = async (tableName: string, page: number = 1, sortBy?: string, sortDirection?: 'asc' | 'desc') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        table: tableName,
        page: page.toString(),
        limit: '25'
      });
      
      if (sortBy) {
        params.append('orderBy', sortBy);
        params.append('orderDirection', sortDirection || orderDirection);
      } else if (orderBy) {
        params.append('orderBy', orderBy);
        params.append('orderDirection', orderDirection);
      }
      
      const response = await fetch(`/api/admin/db?${params.toString()}`);
      if (!response.ok) {
        throw new Error('테이블 데이터 조회 실패');
      }
      const data = await response.json();
      setTableData(data);
      setCurrentPage(page);
      setExpandedItems(new Set());
    } catch {
      setError('테이블 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    // 정렬 상태 초기화
    setOrderBy(null);
    setOrderDirection('desc');
    fetchTableData(tableName, 1);
  };

  const handlePageChange = (page: number) => {
    if (selectedTable) {
      fetchTableData(selectedTable, page);
    }
  };

  const handleSort = (field: string) => {
    if (selectedTable) {
      let newDirection: 'asc' | 'desc' = 'desc';
      
      if (orderBy === field) {
        // 같은 필드를 클릭한 경우 방향 토글
        newDirection = orderDirection === 'desc' ? 'asc' : 'desc';
      }
      
      setOrderBy(field);
      setOrderDirection(newDirection);
      setCurrentPage(1);
      fetchTableData(selectedTable, 1, field, newDirection);
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'users':
        return <Users className="w-4 h-4" />;
      case 'queue_requests':
        return <Video className="w-4 h-4" />;
      case 'lora_presets':
        return <Settings className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortIcon = (field: string) => {
    if (orderBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
    }
    return orderDirection === 'desc' 
      ? <ArrowDown className="w-3 h-3" />
      : <ArrowUp className="w-3 h-3" />;
  };

  const SortableHeader = ({ field, children, className = "" }: { field: string; children: React.ReactNode; className?: string }) => (
    <div 
      className={`flex items-center space-x-1 cursor-pointer hover:text-foreground ${className}`}
      onClick={() => handleSort(field)}
    >
      <span>{children}</span>
      {getSortIcon(field)}
    </div>
  );

  const renderUsersList = () => {
    if (!tableData?.data) return null;

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* 헤더 */}
        <div className="bg-muted px-4 py-3 border-b font-medium text-sm grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <SortableHeader field="nickname">닉네임</SortableHeader>
          </div>
          <div className="col-span-3">
            <SortableHeader field="discordUsername">Discord 사용자명</SortableHeader>
          </div>
          <div className="col-span-2">
            <SortableHeader field="createdAt">가입일</SortableHeader>
          </div>
          <div className="col-span-2">
            <SortableHeader field="lastLoginAt">최근 로그인</SortableHeader>
          </div>
          <div className="col-span-2">큐/프리셋</div>
        </div>

        {/* 데이터 행들 */}
        <div className="divide-y">
          {tableData.data.map((user: any, index: number) => {
            const itemId = `user-${index}`;
            const isExpanded = expandedItems.has(itemId);
            
            return (
              <div key={index}>
                <div 
                  className="px-4 py-3 hover:bg-muted/50 cursor-pointer grid grid-cols-12 gap-4 items-center text-sm"
                  onClick={() => toggleExpanded(itemId)}
                >
                  <div className="col-span-3 font-medium">{user.nickname}</div>
                  <div className="col-span-3 text-muted-foreground">{user.discordUsername}</div>
                  <div className="col-span-2 text-xs">{formatDate(user.createdAt)}</div>
                  <div className="col-span-2 text-xs">{formatDate(user.lastLoginAt)}</div>
                  <div className="col-span-2 flex space-x-1">
                    {user._count && (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          큐 {user._count.queueRequests}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          프리셋 {user._count.loraPresets}
                        </Badge>
                      </>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-3 bg-muted/20 border-t text-xs space-y-2">
                    <div>
                      <span className="font-medium">Discord ID:</span>
                      <span className="ml-2 font-mono">{user.discordId}</span>
                    </div>
                    <div>
                      <span className="font-medium">수정일:</span>
                      <span className="ml-2">{formatDate(user.updatedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQueueList = () => {
    if (!tableData?.data) return null;

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* 헤더 */}
        <div className="bg-muted px-4 py-3 border-b font-medium text-sm grid grid-cols-12 gap-4">
          <div className="col-span-2">
            <SortableHeader field="nickname">닉네임</SortableHeader>
          </div>
          <div className="col-span-2">
            <SortableHeader field="status">상태</SortableHeader>
          </div>
          <div className="col-span-1">
            <SortableHeader field="position">위치</SortableHeader>
          </div>
          <div className="col-span-3">
            <SortableHeader field="createdAt">생성일</SortableHeader>
          </div>
          <div className="col-span-2">NSFW/기타</div>
          <div className="col-span-2">작업 정보</div>
        </div>

        {/* 데이터 행들 */}
        <div className="divide-y">
          {tableData.data.map((request: any, index: number) => {
            const itemId = `queue-${index}`;
            const isExpanded = expandedItems.has(itemId);
            
            return (
              <div key={index}>
                <div 
                  className="px-4 py-3 hover:bg-muted/50 cursor-pointer grid grid-cols-12 gap-4 items-center text-sm"
                  onClick={() => toggleExpanded(itemId)}
                >
                  <div className="col-span-2 font-medium">{request.nickname}</div>
                  <div className="col-span-2">
                    <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                      {request.status}
                    </Badge>
                  </div>
                  <div className="col-span-1">#{request.position}</div>
                  <div className="col-span-3 text-xs">{formatDate(request.createdAt)}</div>
                  <div className="col-span-2">
                    {request.isNSFW && (
                      <Badge variant="destructive" className="text-xs">NSFW</Badge>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center">
                    {request.jobId && (
                      <Badge variant="outline" className="text-xs">작업중</Badge>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-3 bg-muted/20 border-t text-xs space-y-3">
                    <div>
                      <span className="font-medium">프롬프트:</span>
                      <p className="mt-1 p-2 bg-background rounded">{request.prompt}</p>
                    </div>
                    
                    {request.imageFile && (
                      <div>
                        <span className="font-medium">이미지 파일:</span>
                        <span className="ml-2">{request.imageFile}</span>
                      </div>
                    )}

                    {request.loraPresetData && (
                      <div>
                        <span className="font-medium">LoRA 프리셋:</span>
                        {(() => {
                          try {
                            const presetData = JSON.parse(request.loraPresetData);
                            return (
                              <div className="mt-1 p-2 bg-background rounded">
                                {presetData.presetName && (
                                  <div className="font-medium text-xs mb-2">{presetData.presetName}</div>
                                )}
                                {presetData.loraItems && presetData.loraItems.length > 0 && (
                                  <div className="space-y-1">
                                    {presetData.loraItems.map((item: any, index: number) => {
                                      const displayName = item.loraName || item.loraFilename || '알 수 없는 LoRA';
                                      
                                      return (
                                        <div key={index} className="text-xs p-1 bg-muted rounded border">
                                          <div className="font-medium">{displayName}</div>
                                          <div className="text-muted-foreground">
                                            강도: {item.strength} | 그룹: <span className={item.group === 'HIGH' ? 'text-blue-600' : 'text-green-600'}>{item.group}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          } catch {
                            return (
                              <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                                {request.loraPresetData}
                              </pre>
                            );
                          }
                        })()}
                      </div>
                    )}

                    {request.jobId && (
                      <div>
                        <span className="font-medium">작업 ID:</span>
                        <span className="ml-2 font-mono">{request.jobId}</span>
                      </div>
                    )}

                    {request.error && (
                      <div>
                        <span className="font-medium">오류:</span>
                        <p className="mt-1 p-2 bg-red-50 rounded text-xs text-red-700">{request.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLoRAPresetsList = () => {
    if (!tableData?.data) return null;

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* 헤더 */}
        <div className="bg-muted px-4 py-3 border-b font-medium text-sm grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <SortableHeader field="name">프리셋 이름</SortableHeader>
          </div>
          <div className="col-span-2">소유자</div>
          <div className="col-span-2">
            <SortableHeader field="isDefault">속성</SortableHeader>
          </div>
          <div className="col-span-2">아이템 개수</div>
          <div className="col-span-3">
            <SortableHeader field="createdAt">생성일</SortableHeader>
          </div>
        </div>

        {/* 데이터 행들 */}
        <div className="divide-y">
          {tableData.data.map((preset: any, index: number) => {
            const itemId = `preset-${index}`;
            const isExpanded = expandedItems.has(itemId);
            
            return (
              <div key={index}>
                <div 
                  className="px-4 py-3 hover:bg-muted/50 cursor-pointer grid grid-cols-12 gap-4 items-center text-sm"
                  onClick={() => toggleExpanded(itemId)}
                >
                  <div className="col-span-3 font-medium">{preset.name}</div>
                  <div className="col-span-2 text-muted-foreground">{preset.user?.nickname}</div>
                  <div className="col-span-2 flex space-x-1">
                    {preset.isDefault && (
                      <Badge variant="default" className="text-xs">기본</Badge>
                    )}
                    {preset.isPublic && (
                      <Badge variant="secondary" className="text-xs">공개</Badge>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs">
                      {preset._count?.loraItems || 0}개
                    </Badge>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-xs">{formatDate(preset.createdAt)}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                  </div>
                </div>

                {isExpanded && preset.loraItems && (
                  <div className="px-4 py-3 bg-muted/20 border-t">
                    <div className="font-medium text-sm mb-2">LoRA 아이템들:</div>
                    <div className="space-y-2">
                      {preset.loraItems.map((item: any, itemIndex: number) => {
                        const displayName = item.loraName || item.loraFilename || '알 수 없는 LoRA';
                        
                        return (
                          <div key={itemIndex} className="p-2 bg-background rounded text-xs">
                            <div className="font-medium">{displayName}</div>
                            <div className="text-muted-foreground">
                              강도: {item.strength} | 그룹: <span className={item.group === 'HIGH' ? 'text-blue-600' : 'text-green-600'}>{item.group}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTableData = () => {
    if (!tableData || !tableData.data.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          데이터가 없습니다.
        </div>
      );
    }

    switch (selectedTable) {
      case 'users':
        return renderUsersList();
      case 'queue_requests':
        return renderQueueList();
      case 'lora_presets':
        return renderLoRAPresetsList();
      default:
        return null;
    }
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tables.map((table) => (
                <Card 
                  key={table.name} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTableSelect(table.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTableIcon(table.name)}
                        <div>
                          <h3 className="font-semibold text-sm">{table.displayName}</h3>
                          <p className="text-xs text-muted-foreground">{table.name}</p>
                        </div>
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
                  {getTableIcon(selectedTable)}
                  <span className="ml-2">{tables.find(t => t.name === selectedTable)?.displayName} 테이블</span>
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
            ) : (
              <>
                {renderTableData()}

                {tableData && tableData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}