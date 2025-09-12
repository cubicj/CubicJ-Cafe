import { NextRequest, NextResponse } from 'next/server';

interface TranslateRequest {
  text: string;
  service: 'google' | 'gemini';
  sourceLang: string;
  targetLang: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { text, service, sourceLang, targetLang } = body;

    if (!text || !service || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    let translatedText: string;

    switch (service) {
      case 'google':
        translatedText = await translateWithGoogle(text, sourceLang, targetLang);
        break;
      case 'gemini':
        translatedText = await translateWithGemini(text, sourceLang, targetLang);
        break;
      default:
        return NextResponse.json(
          { error: '지원하지 않는 번역 서비스입니다.' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      translatedText,
      originalText: text,
      service,
      sourceLang,
      targetLang,
    });

  } catch (error) {
    console.error('번역 API 오류:', error);
    return NextResponse.json(
      { error: '번역 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function translateWithGoogle(text: string, sourceLang: string, targetLang: string): Promise<string> {
  // Google Translate 무료 API 사용
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Google 번역 API 호출 실패');
  }
  
  const data = await response.json();
  
  // Google Translate API 응답 파싱
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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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