"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientIcon } from '@/components/ui/client-icon';
import { Video, Image } from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-200 flex-1">
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-slate-800">
            CubicJ Cafe
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            ComfyUI 워크플로우를 위한 웹 프론트엔드
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 pb-32">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center opacity-50">
            <CardHeader>
              <ClientIcon icon={Image} className="h-12 w-12 mx-auto text-emerald-600" fallback="🖼️" />
              <CardTitle>Txt to Img</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>준비중</Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <ClientIcon icon={Video} className="h-12 w-12 mx-auto text-blue-600" fallback="🎬" />
              <CardTitle>Img to Vid</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/i2v">시작하기</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <GithubIcon className="h-12 w-12 mx-auto text-slate-700" />
              <CardTitle>GitHub</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <a href="https://github.com/cubicj/CubicJ-Cafe" target="_blank" rel="noopener noreferrer">소스코드 보기</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
