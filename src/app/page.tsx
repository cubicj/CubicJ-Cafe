"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ClientIcon } from '@/components/ui/client-icon';
import { Video, Image } from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';

export default function Home() {
  return (
    <div className="flex-1">
      <section className="container mx-auto max-w-4xl px-4 pt-16 sm:pt-24">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">CubicJ Cafe</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            ComfyUI와 Discord를 연결하는 풀스택 AI 비디오 생성 플랫폼
          </p>
          <p className="font-mono text-xs text-muted-foreground/80">
            WAN 2.2 · LTX 2.3 · MiniMax H3
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl space-y-4 px-4 pb-24 pt-10">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <ClientIcon icon={Video} className="h-5 w-5 text-primary" fallback="🎬" />
                <h2 className="text-lg font-semibold">Img to Vid</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                이미지 한 장으로 비디오를 생성하고 Discord로 전송합니다.
              </p>
            </div>
            <Button asChild size="lg" className="sm:shrink-0">
              <Link href="/i2v">시작하기</Link>
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5 bg-muted/40 border-dashed justify-center">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClientIcon icon={Image} className="h-4 w-4 text-muted-foreground" fallback="🖼️" />
                <span className="text-sm font-semibold">Txt to Img</span>
              </div>
              <Badge variant="outline" className="bg-background text-xs text-muted-foreground">준비중</Badge>
            </div>
          </Card>
          <Card className="p-5 justify-center">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GithubIcon className="h-4 w-4 text-foreground" />
                <span className="text-sm font-semibold">GitHub</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href="https://github.com/cubicj/CubicJ-Cafe" target="_blank" rel="noopener noreferrer">
                  소스코드 보기
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
