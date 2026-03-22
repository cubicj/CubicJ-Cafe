"use client";

import { useState } from "react";
import { createLogger } from '@/lib/logger';

const log = createLogger('ui');
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
      log.info('Prompt copied to clipboard');
    } catch (error) {
      log.error('Clipboard copy failed', { error: error instanceof Error ? error.message : String(error) });
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
        log.error('Share failed', { error: error instanceof Error ? error.message : String(error) });
      }
    } else {
      try {
        await navigator.clipboard.writeText(imageUrl);
        log.info('Image URL copied to clipboard');
      } catch (error) {
        log.error('URL copy failed', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative">
        {isLoading && (
          <div className="aspect-square bg-muted animate-pulse flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-muted-foreground/20 border-t-muted-foreground/40 rounded-full animate-spin" />
          </div>
        )}
        
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

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">생성된 이미지</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {prompt}
          </p>
        </div>

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