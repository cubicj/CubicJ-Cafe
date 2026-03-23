"use client";

import { useState, useEffect } from "react";
import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

const log = createLogger('ui');
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Plus, Edit, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoRABundle {
  id: string;
  displayName: string;
  highLoRAFilename: string;
  lowLoRAFilename: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function LoRABundleManager() {
  const [bundles, setBundles] = useState<LoRABundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [availableLoRAs, setAvailableLoRAs] = useState<{
    high: string[];
    low: string[];
  }>({ high: [], low: [] });
  const [isLoadingLoRAs, setIsLoadingLoRAs] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<LoRABundle | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    highLoRAFilename: '',
    lowLoRAFilename: '',
  });

  const fetchBundles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<{ bundles: LoRABundle[]; count: number }>('/api/admin/lora-bundles');
      setBundles(data.bundles || []);
      log.info('LoRA bundle list fetched', { count: data.count });
    } catch (err) {
      log.error('Failed to fetch LoRA bundle list', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : '번들 목록 조회 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableLoRAs = async () => {
    setIsLoadingLoRAs(true);

    try {
      const data = await apiClient.get<{ categorized: { high: string[]; low: string[] } }>('/api/comfyui/loras');
      setAvailableLoRAs({
        high: data.categorized?.high || [],
        low: data.categorized?.low || [],
      });
      log.info('LoRA file list fetched', { high: data.categorized?.high?.length || 0, low: data.categorized?.low?.length || 0 });
    } catch (err) {
      if (err instanceof Error && !err.message.includes('503') && !err.message.includes('Service Unavailable')) {
        log.error('Failed to fetch LoRA file list', { error: err instanceof Error ? err.message : String(err) });
      }
      setError(err instanceof Error ? err.message : 'LoRA 파일 목록 조회 실패');
    } finally {
      setIsLoadingLoRAs(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingBundle 
        ? `/api/admin/lora-bundles/${editingBundle.id}`
        : '/api/admin/lora-bundles';
      
      const method = editingBundle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '번들 저장에 실패했습니다');
      }

      log.info('LoRA bundle saved successfully', { action: editingBundle ? 'updated' : 'created' });
      
      await fetchBundles();
      setIsDialogOpen(false);
      setEditingBundle(null);
      resetForm();
      
    } catch (err) {
      log.error('Failed to save LoRA bundle', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : '번들 저장 실패');
    }
  };

  const handleDelete = async (bundleId: string) => {
    if (!confirm('정말로 이 번들을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/lora-bundles/${bundleId}`);
      log.info('LoRA bundle deleted successfully');
      await fetchBundles();
    } catch (err) {
      log.error('Failed to delete LoRA bundle', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : '번들 삭제 실패');
    }
  };



  const resetForm = () => {
    setFormData({
      displayName: '',
      highLoRAFilename: '',
      lowLoRAFilename: '',
    });
  };

  const getUsedLoRAFiles = () => {
    const usedFiles = new Set<string>();
    bundles.forEach(bundle => {
      if (editingBundle && bundle.id === editingBundle.id) {
        return;
      }
      usedFiles.add(bundle.highLoRAFilename);
      usedFiles.add(bundle.lowLoRAFilename);
    });
    return usedFiles;
  };

  const sortLoRAsByUsage = (loraFiles: string[]) => {
    const usedFiles = getUsedLoRAFiles();
    const unused = loraFiles.filter(file => !usedFiles.has(file));
    const used = loraFiles.filter(file => usedFiles.has(file));
    return [...unused, ...used];
  };

  const isLoRAUsed = (filename: string) => {
    const usedFiles = getUsedLoRAFiles();
    return usedFiles.has(filename);
  };

  const handleEdit = (bundle: LoRABundle) => {
    setEditingBundle(bundle);
    setFormData({
      displayName: bundle.displayName,
      highLoRAFilename: bundle.highLoRAFilename,
      lowLoRAFilename: bundle.lowLoRAFilename,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBundle(null);
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchBundles();
    fetchAvailableLoRAs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>LoRA 번들 목록을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center p-4 text-red-800 border border-red-300 rounded-md bg-red-50">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">LoRA 번들 관리</h2>
          <p className="text-gray-600 mt-1">
            High 또는 Low LoRA 파일(둘 중 하나 또는 둘 다)을 하나의 번들로 묶어서 관리합니다. 표시명 순으로 자동 정렬됩니다.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={fetchAvailableLoRAs} 
            disabled={isLoadingLoRAs}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLoRAs ? 'animate-spin' : ''}`} />
            LoRA 새로고침
          </Button>
          <Button onClick={handleAdd} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            새 번들 추가
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {bundles.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8 text-gray-500">
              등록된 LoRA 번들이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {bundles.map((bundle) => (
              <Card key={bundle.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-1">
                        <h3 className="font-semibold">{bundle.displayName}</h3>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          <span className="font-medium">High:</span> 
                          <span className={bundle.highLoRAFilename ? "" : "text-muted-foreground italic"}>
                            {bundle.highLoRAFilename || "없음"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Low:</span> 
                          <span className={bundle.lowLoRAFilename ? "" : "text-muted-foreground italic"}>
                            {bundle.lowLoRAFilename || "없음"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(bundle)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(bundle.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-xl">
              {editingBundle ? 'LoRA 번들 편집' : '새 LoRA 번들 추가'}
            </DialogTitle>
            <DialogDescription className="text-base">
              High 또는 Low LoRA 파일(둘 중 하나 또는 둘 다)을 하나의 번들로 묶어서 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">표시명</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="사용자에게 표시될 이름 (예: 애니메이션 스타일)"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="highLoRAFilename" className="text-sm font-medium">High LoRA 파일명 (선택사항)</Label>
              <Select 
                value={formData.highLoRAFilename} 
                onValueChange={(value) => setFormData({ ...formData, highLoRAFilename: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="High LoRA 파일을 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {isLoadingLoRAs ? (
                    <div className="p-3 text-sm text-gray-500 text-center">LoRA 파일 목록 로딩 중...</div>
                  ) : (
                    sortLoRAsByUsage(availableLoRAs.high).map((lora) => {
                      const isUsed = isLoRAUsed(lora);
                      return (
                        <SelectItem 
                          key={lora} 
                          value={lora}
                          className={cn(
                            "py-2 px-3",
                            isUsed && "text-gray-400"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={cn(
                              "truncate",
                              isUsed && "line-through"
                            )}>
                              {lora.replace('WAN\\High\\', '')}
                            </span>
                            {isUsed && (
                              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                사용 중
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowLoRAFilename" className="text-sm font-medium">Low LoRA 파일명 (선택사항)</Label>
              <Select 
                value={formData.lowLoRAFilename} 
                onValueChange={(value) => setFormData({ ...formData, lowLoRAFilename: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Low LoRA 파일을 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {isLoadingLoRAs ? (
                    <div className="p-3 text-sm text-gray-500 text-center">LoRA 파일 목록 로딩 중...</div>
                  ) : (
                    sortLoRAsByUsage(availableLoRAs.low).map((lora) => {
                      const isUsed = isLoRAUsed(lora);
                      return (
                        <SelectItem 
                          key={lora} 
                          value={lora}
                          className={cn(
                            "py-2 px-3",
                            isUsed && "text-gray-400"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={cn(
                              "truncate",
                              isUsed && "line-through"
                            )}>
                              {lora.replace('WAN\\Low\\', '')}
                            </span>
                            {isUsed && (
                              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                사용 중
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

          </div>

          <DialogFooter className="pt-6 gap-3 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="min-w-[80px]"
            >
              취소
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.displayName || (!formData.highLoRAFilename && !formData.lowLoRAFilename)}
              className="min-w-[80px]"
            >
              {editingBundle ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}