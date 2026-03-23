'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database } from 'lucide-react';
import { useDatabaseTable } from '@/hooks/useDatabaseTable';
import { Pagination } from '@/components/ui/pagination';
import { getTableIcon } from '@/components/database/db-utils';
import { UsersTable } from '@/components/database/UsersTable';
import { QueueTable } from '@/components/database/QueueTable';
import { LoRAPresetsTable } from '@/components/database/LoRAPresetsTable';

interface ListDatabaseViewerProps {
  className?: string;
}

export default function ListDatabaseViewer({ className }: ListDatabaseViewerProps) {
  const {
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
  } = useDatabaseTable();

  const renderTableData = () => {
    if (!tableData || !tableData.data.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          데이터가 없습니다.
        </div>
      );
    }

    const sharedProps = {
      data: tableData.data,
      sort,
      expandedItems,
      onSort: toggleSort,
      onToggleExpand: toggleExpanded,
    };

    switch (selectedTable) {
      case 'users':
        return <UsersTable {...sharedProps} />;
      case 'queue_requests':
        return <QueueTable {...sharedProps} />;
      case 'lora_presets':
        return <LoRAPresetsTable {...sharedProps} />;
      default:
        return null;
    }
  };

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
                  onClick={() => selectTable(table.name)}
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
                onClick={goBack}
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
                {tableData && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={tableData.totalPages}
                    totalCount={tableData.totalCount}
                    limit={tableData.limit}
                    onPageChange={goToPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
