import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseBody } from '@/lib/validations/parse';
import { translateSchema } from '@/lib/validations/schemas/translate';

export const POST = createRouteHandler(
  { auth: 'none' },
  async (req) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 });
    }

    const parsed = parseBody(translateSchema, body);
    if (!parsed.success) return parsed.response;

    const { text, service, sourceLang, targetLang } = parsed.data;

    let translatedText: string;

    switch (service) {
      case 'google':
        translatedText = await translateWithGoogle(text, sourceLang, targetLang);
        break;
      case 'gemini':
        translatedText = await translateWithGemini(text, sourceLang, targetLang);
        break;
    }

    return {
      translatedText,
      originalText: text,
      service,
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
    return data[0].map((item: any[]) => item[0]).join('');
  }

  throw new Error('Google 번역 응답 파싱 실패');
}

async function translateWithGemini(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.');
  }

  const sourceLangName = getLanguageName(sourceLang);
  const targetLangName = getLanguageName(targetLang);

  const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. Only return the translated text, no explanations or additional content:

${text}`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Gemini API 호출 실패');
  }

  const data = await response.json();

  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text.trim();
  }

  throw new Error('Gemini API 응답 파싱 실패');
}

function getLanguageName(langCode: string): string {
  const languageMap: Record<string, string> = {
    'ko': 'Korean',
    'en': 'English',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ru': 'Russian'
  };

  return languageMap[langCode] || langCode;
}
