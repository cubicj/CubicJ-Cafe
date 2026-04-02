import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseBody } from '@/lib/validations/parse';
import { translateSchema } from '@/lib/validations/schemas/translate';

export const POST = createRouteHandler(
  { auth: 'user' },
  async (req) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 });
    }

    const parsed = parseBody(translateSchema, body);
    if (!parsed.success) return parsed.response;

    const { text, sourceLang, targetLang } = parsed.data;

    const translatedText = await translateWithGoogle(text, sourceLang, targetLang);

    return {
      translatedText,
      originalText: text,
      sourceLang,
      targetLang,
    };
  }
);

async function translateWithGoogle(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Google 번역 API 호출 실패');
  }

  const data = await response.json();

  if (data && data[0] && Array.isArray(data[0])) {
    return data[0].map((item: [string, ...unknown[]]) => item[0]).join('');
  }

  throw new Error('Google 번역 응답 파싱 실패');
}
