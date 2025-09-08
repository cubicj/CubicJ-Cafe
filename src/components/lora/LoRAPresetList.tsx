"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Edit, Trash2, AlertCircle, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { LoRAPresetListProps } from "@/types/lora";

export function LoRAPresetList({
  presets,
  selectedPresetIds,
  expandedPresets,
  isLoading,
  isRefreshingLoRAs,
  error,
  onPresetSelect,
  onPresetExpand,
  onPresetEdit,
  onPresetDelete,
  onNewPreset,
  onRefresh,
  onDragEnd,
  isLoRAAvailable,
}: LoRAPresetListProps) {
  const selectedPresets = presets.filter(p => selectedPresetIds.includes(p.id));

  const getCombinedLoRAItems = () => {
    const highLoRAMap = new Map();
    const lowLoRAMap = new Map();
    
    selectedPresets.forEach(preset => {
      preset.loraItems.forEach(item => {
        if (item.group === 'HIGH') {
          highLoRAMap.set(item.loraFilename, {
            loraFilename: item.loraFilename,
            loraName: item.loraName,
            strength: item.strength,
            group: item.group
          });
        } else if (item.group === 'LOW') {
          lowLoRAMap.set(item.loraFilename, {
            loraFilename: item.loraFilename,
            loraName: item.loraName,
            strength: item.strength,
            group: item.group
          });
        }
      });
    });
    
    return [...Array.from(highLoRAMap.values()), ...Array.from(lowLoRAMap.values())];
  };

  const combinedLoRAItems = getCombinedLoRAItems();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading || isRefreshingLoRAs}
          className="h-9 px-3"
          title="ComfyUI LoRA 목록 새로고침"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshingLoRAs ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="outline" 
          size="sm"
          onClick={onNewPreset}
          className="h-9 px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            프리셋 로딩 중...
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            사용 가능한 프리셋이 없습니다.
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="presets">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {presets.map((preset, index) => {
                    const isSelected = selectedPresetIds.includes(preset.id);
                    const isExpanded = expandedPresets.has(preset.id);
                    const isDraggable = !preset.isPublic;
                    
                    return (
                      <Draggable 
                        key={preset.id} 
                        draggableId={preset.id} 
                        index={index}
                        isDragDisabled={!isDraggable}
                      >
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "border rounded-lg overflow-hidden transition-shadow",
                              snapshot.isDragging && "shadow-lg ring-2 ring-blue-500 ring-opacity-50",
                              !isDraggable && "opacity-60"
                            )}
                          >
                            <div className="flex items-center">
                              {isDraggable && (
                                <div 
                                  {...provided.dragHandleProps}
                                  className="px-2 py-3 cursor-move"
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              
                              <div className={cn("p-3 flex items-center", !isDraggable && "pl-6")}>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => onPresetSelect(preset.id)}
                                  className="h-4 w-4 cursor-pointer"
                                />
                              </div>
                              
                              <div 
                                className="flex items-center gap-3 py-3 flex-1 cursor-pointer min-h-[48px]"
                                onClick={() => onPresetExpand(preset.id)}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPresetExpand(preset.id);
                                  }}
                                  className="p-0 border-0 bg-transparent"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="font-medium text-sm">{preset.name}</span>
                                  {preset.isPublic && (
                                    <Badge variant="outline" className="text-xs">공개</Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 px-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onPresetEdit(preset)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onPresetDelete(preset)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {isExpanded && preset.loraItems.length > 0 && (
                              <div className="px-3 sm:px-6 pb-3 space-y-3 bg-muted/25">
                                {preset.loraItems.filter(item => item.group === 'HIGH').length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium">High 모델:</p>
                                    <div className="space-y-1 pl-2">
                                      {preset.loraItems.filter(item => item.group === 'HIGH').map((item, index) => {
                                        const isAvailable = isLoRAAvailable(item.loraFilename);
                                        return (
                                          <div key={`high-${index}`} className="flex items-center justify-between gap-2 text-xs">
                                            <Badge 
                                              variant="outline" 
                                              className={cn(
                                                "font-mono text-xs truncate cursor-help flex-1 min-w-0",
                                                !isAvailable && "border-red-500 text-red-700 bg-red-50 dark:border-red-400 dark:text-red-300 dark:bg-red-950"
                                              )}
                                              title={`${item.loraName} (${item.loraFilename})${!isAvailable ? ' - 서버에서 찾을 수 없음' : ''}`}
                                            >
                                              {item.loraName}
                                            </Badge>
                                            <span className="text-muted-foreground flex-shrink-0 text-xs whitespace-nowrap">
                                              강도: {item.strength.toFixed(1)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {preset.loraItems.filter(item => item.group === 'LOW').length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium">Low 모델:</p>
                                    <div className="space-y-1 pl-2">
                                      {preset.loraItems.filter(item => item.group === 'LOW').map((item, index) => {
                                        const isAvailable = isLoRAAvailable(item.loraFilename);
                                        return (
                                          <div key={`low-${index}`} className="flex items-center justify-between gap-2 text-xs">
                                            <Badge 
                                              variant="secondary" 
                                              className={cn(
                                                "font-mono text-xs truncate cursor-help flex-1 min-w-0",
                                                !isAvailable && "border-red-500 text-red-700 bg-red-50 dark:border-red-400 dark:text-red-300 dark:bg-red-950"
                                              )}
                                              title={`${item.loraName} (${item.loraFilename})${!isAvailable ? ' - 서버에서 찾을 수 없음' : ''}`}
                                            >
                                              {item.loraName}
                                            </Badge>
                                            <span className="text-muted-foreground flex-shrink-0 text-xs whitespace-nowrap">
                                              강도: {item.strength.toFixed(1)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
      
      {selectedPresets.length > 0 && (
        <div className="space-y-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm text-muted-foreground">최종 적용될 LoRA</h4>
          
          {combinedLoRAItems.length > 0 && (
            <div className="space-y-3">
              {combinedLoRAItems.filter(item => item.group === 'HIGH').length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">High 모델:</p>
                  <div className="space-y-1 pl-2">
                    {combinedLoRAItems.filter(item => item.group === 'HIGH').map((item, index) => {
                      const isAvailable = isLoRAAvailable(item.loraFilename);
                      return (
                        <div key={`combined-high-${index}`} className="flex items-center justify-between gap-2 text-xs">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "font-mono text-xs truncate cursor-help flex-1 min-w-0",
                              !isAvailable && "border-red-500 text-red-700 bg-red-50 dark:border-red-400 dark:text-red-300 dark:bg-red-950"
                            )}
                            title={`${item.loraName} (${item.loraFilename})${!isAvailable ? ' - 서버에서 찾을 수 없음' : ''}`}
                          >
                            {item.loraName}
                          </Badge>
                          <span className="text-muted-foreground flex-shrink-0 text-xs whitespace-nowrap">
                            강도: {item.strength.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {combinedLoRAItems.filter(item => item.group === 'LOW').length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Low 모델:</p>
                  <div className="space-y-1 pl-2">
                    {combinedLoRAItems.filter(item => item.group === 'LOW').map((item, index) => {
                      const isAvailable = isLoRAAvailable(item.loraFilename);
                      return (
                        <div key={`combined-low-${index}`} className="flex items-center justify-between gap-2 text-xs">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "font-mono text-xs truncate cursor-help flex-1 min-w-0",
                              !isAvailable && "border-red-500 text-red-700 bg-red-50 dark:border-red-400 dark:text-red-300 dark:bg-red-950"
                            )}
                            title={`${item.loraName} (${item.loraFilename})${!isAvailable ? ' - 서버에서 찾을 수 없음' : ''}`}
                          >
                            {item.loraName}
                          </Badge>
                          <span className="text-muted-foreground flex-shrink-0 text-xs whitespace-nowrap">
                            강도: {item.strength.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}