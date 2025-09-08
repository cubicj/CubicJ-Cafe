"use client";

import { useState } from "react";
import { Card } from "./card";
import { Button } from "./button";
import { Download, Share2, RefreshCw, Heart, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageResultProps {
  imageUrl: string;
  prompt: string;
  onRegenerate?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function ImageResult({
  imageUrl,
  prompt,
  onRegenerate,
  onDownload,
  className,
}: ImageResultProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      // TODO: 토스트 알림 구현
      console.log("프롬프트가 클립보드에 복사되었습니다");
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI 생성 이미지",
          text: `프롬프트: ${prompt}`,
          url: imageUrl,
        });
      } catch (error) {
        console.error("공유 실패:", error);
      }
    } else {
      // 폴백: URL 복사
      try {
        await navigator.clipboard.writeText(imageUrl);
        console.log("이미지 URL이 클립보드에 복사되었습니다");
      } catch (error) {
        console.error("URL 복사 실패:", error);
      }
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative">
        {/* 이미지 로딩 스켈레톤 */}
        {isLoading && (
          <div className="aspect-square bg-muted animate-pulse flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-muted-foreground/20 border-t-muted-foreground/40 rounded-full animate-spin" />
          </div>
        )}
        
        {/* 생성된 이미지 */}
        <Image
          src={imageUrl}
          alt="AI 생성 이미지"
          width={400}
          height={400}
          className={cn(
            "w-full aspect-square object-cover transition-opacity duration-300",
            isLoading ? "opacity-0 absolute inset-0" : "opacity-100"
          )}
          onLoad={handleImageLoad}
        />

        {/* 좋아요 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute top-3 right-3 bg-black/20 hover:bg-black/40 text-white",
            isLiked ? "text-red-400" : ""
          )}
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart className={cn("h-4 w-4", isLiked ? "fill-current" : "")} />
        </Button>
      </div>

      {/* 이미지 정보 및 액션 */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">생성된 이미지</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {prompt}
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            다운로드
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrompt}
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>생성 시간: {new Date().toLocaleTimeString()}</span>
            <span>1024x1024px</span>
          </div>
        </div>
      </div>
    </Card>
  );
}