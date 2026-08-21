import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <h1 className="text-6xl font-bold font-mono text-foreground mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">페이지를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild>
            <Link href="/">
              홈으로 돌아가기
            </Link>
          </Button>
          
          <div className="text-sm text-muted-foreground">
            또는{' '}
            <Link href="/i2v" className="text-primary hover:text-primary/80 underline">
              Img to Vid
            </Link>
            로 이동하세요
          </div>
        </div>
      </div>
    </div>
  );
}
