"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientIcon } from '@/components/ui/client-icon';
import { Palette, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-200 min-h-full">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-slate-800">
            CubicJ Cafe
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            미니 서버에서 운영하는 개인 웹 서비스 허브
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-16 pb-32">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">
          서비스
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <ClientIcon icon={Palette} className="h-12 w-12 mx-auto text-blue-600" fallback="🎨" />
              <CardTitle>ComfyUI</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="mt-4">
                <Link href="/generate">시작하기</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <ClientIcon icon={Zap} className="h-12 w-12 mx-auto text-purple-600" fallback="⚡" />
              <CardTitle>더 많은 서비스</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                곧 새로운 서비스들이 추가될 예정입니다
              </p>
              <Button variant="outline" className="mt-4" disabled>
                준비중
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
