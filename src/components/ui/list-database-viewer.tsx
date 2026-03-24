'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDatabaseTable } from '@/hooks/useDatabaseTable';
import { Pagination } from '@/components/ui/pagination';
import { getTableIcon } from '@/components/database/db-utils';
import { UsersTable } from '@/components/database/UsersTable';
import { QueueTable } from '@/components/database/QueueTable';
import { LoRAPresetsTable } from '@/components/database/LoRAPresetsTable';

export default function ListDatabaseViewer() {
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
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">데이터베이스 로딩 중...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedTable ? (
        <>
          <h3 className="text-lg font-semibold">데이터베이스 테이블</h3>
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
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                {getTableIcon(selectedTable)}
                <span className="ml-2">{tables.find(t => t.name === selectedTable)?.displayName}</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                총 {tableData?.totalCount}개 레코드 중 {currentPage}페이지
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={goBack}>
              테이블 목록으로
            </Button>
          </div>
          {loading ? (
            <p className="text-center py-8 text-sm text-muted-foreground">데이터 로딩 중...</p>
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
        </>
      )}
    </Card>
  );
}
