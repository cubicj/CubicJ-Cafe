import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild>
            <Link href="/">
              홈으로 돌아가기
            </Link>
          </Button>
          
          <div className="text-sm text-gray-500">
            또는{' '}
            <Link href="/generate" className="text-blue-600 hover:text-blue-800 underline">
              AI 생성 페이지
            </Link>
            로 이동하세요
          </div>
        </div>
      </div>
    </div>
  );
}