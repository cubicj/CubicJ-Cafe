import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/auth/session';
import { queueService } from '@/lib/database/queue';
import { serverManager } from '@/lib/comfyui/server-manager';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { ServerType } from '@prisma/client';

async function selectBestServer() {
  await serverManager.checkServerHealth();
  const bestServer = serverManager.selectBestServer();
  
  if (!bestServer) {
    return null;
  }

  return {
    serverId: bestServer.id,
    serverType: bestServer.type === 'LOCAL' ? ServerType.LOCAL : ServerType.RUNPOD,
    url: bestServer.url
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Generate API 요청 시작:', {
      method: request.method,
      url: request.url,
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length')
    });

    const sessionId = sessionManager.getSessionIdFromRequest(request);
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
    if (!session?.user) {
      console.log('❌ 인증 실패: 로그인이 필요합니다.');
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    console.log('✅ 사용자 인증 성공:', session.user.nickname);

    // 최적 서버 선택
    const selectedServer = await selectBestServer();
    if (!selectedServer) {
      console.log('❌ 서버 선택 실패: 현재 사용 가능한 ComfyUI 서버가 없습니다.');
      return NextResponse.json({ 
        error: '현재 사용 가능한 서버가 없습니다. 잠시 후 다시 시도해주세요.' 
      }, { status: 503 });
    }

    console.log('✅ 서버 선택 완료:', {
      serverId: selectedServer.serverId,
      serverType: selectedServer.serverType,
      url: selectedServer.url
    });

    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File | null;
    const endImageFile = formData.get('endImage') as File | null;
    const loraName = formData.get('lora') as string;
    const loraStrength = parseFloat(formData.get('loraStrength') as string || '0.8');
    const loraPresetData = formData.get('loraPreset') as string;
    const isNSFW = formData.get('isNSFW') === 'true';
    const duration = parseInt(formData.get('duration') as string || '5');
    
    // duration 유효성 검사 (4-7초만 허용)
    const validDuration = Math.min(Math.max(duration, 4), 7);
    const workflowLength = 16 * validDuration + 1;

    console.log('📋 FormData 파싱 완료:', {
      prompt: prompt?.substring(0, 50) + '...',
      imageFile: imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'null',
      endImageFile: endImageFile ? `${endImageFile.name} (${endImageFile.size} bytes)` : 'null',
      loraName,
      loraStrength,
      hasLoraPreset: !!loraPresetData,
      isNSFW,
      duration: validDuration,
      workflowLength
    });

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: '프롬프트를 입력해주세요.' }, { status: 400 });
    }

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: '이미지를 업로드해주세요.' }, { status: 400 });
    }

    if (prompt.length > 5000) {
      return NextResponse.json({ error: '프롬프트가 너무 깁니다 (최대 5000자).' }, { status: 400 });
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '이미지 파일이 너무 큽니다 (최대 10MB).' }, { status: 400 });
    }

    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: '시작 이미지 파일은 이미지 형식이어야 합니다.' }, { status: 400 });
    }

    // 끝 이미지 파일 유효성 검사 (선택적)
    if (endImageFile) {
      if (endImageFile.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: '끝 이미지 파일이 너무 큽니다 (최대 10MB).' }, { status: 400 });
      }

      if (!endImageFile.type.startsWith('image/')) {
        return NextResponse.json({ error: '끝 이미지 파일은 이미지 형식이어야 합니다.' }, { status: 400 });
      }
    }

    try {
      // LoRA 프리셋 데이터 파싱
      let loraPreset = null;
      if (loraPresetData) {
        try {
          loraPreset = JSON.parse(loraPresetData);
        } catch (parseError) {
          console.error('LoRA 프리셋 데이터 파싱 실패:', parseError);
        }
      }

      // 이미지 파일을 임시 디렉토리에 저장
      const tempDir = join(process.cwd(), 'public', 'temp')
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true })
      }
      
      // 시작 이미지 저장 - UUID + 타임스탬프 + 사용자ID로 고유 파일명 생성
      const uuid = randomUUID()
      const timestamp = Date.now()
      const userId = session.user.id
      const fileExtension = imageFile.name.split('.').pop() || 'png'
      const tempFileName = `${uuid}_${userId}_${timestamp}.${fileExtension}`
      const tempFilePath = join(tempDir, tempFileName)
      
      const imageBuffer = await imageFile.arrayBuffer()
      await writeFile(tempFilePath, Buffer.from(imageBuffer))
      
      console.log('💾 시작 이미지 임시 파일 저장:', {
        originalName: imageFile.name,
        tempFileName,
        size: imageFile.size
      })

      // 끝 이미지 저장 (선택적)
      let endTempFileName = null
      let endTempFilePath = null
      if (endImageFile) {
        const endUuid = randomUUID()
        const endFileExtension = endImageFile.name.split('.').pop() || 'png'
        endTempFileName = `end_${endUuid}_${userId}_${timestamp}.${endFileExtension}`
        endTempFilePath = join(tempDir, endTempFileName)
        
        const endImageBuffer = await endImageFile.arrayBuffer()
        await writeFile(endTempFilePath, Buffer.from(endImageBuffer))
        
        console.log('💾 끝 이미지 임시 파일 저장:', {
          originalName: endImageFile.name,
          tempFileName: endTempFileName,
          size: endImageFile.size
        })
      }

      const requestId = await queueService.createRequest({
        userId: parseInt(session.user.id),
        nickname: session.user.nickname,
        prompt: prompt.trim(),
        imageFile: tempFileName,
        imagePath: tempFilePath,
        endImageFile: endTempFileName || undefined,
        endImagePath: endTempFilePath || undefined,
        lora: loraName && loraName !== 'none' ? loraName : undefined,
        loraStrength: loraName && loraName !== 'none' ? loraStrength : undefined,
        loraPreset: loraPreset,
        isNSFW: isNSFW,
        duration: validDuration,
        workflowLength: workflowLength,
        serverType: selectedServer.serverType,
        serverId: selectedServer.serverId
      });

      console.log(`🎬 큐에 요청 추가됨 - Request ID: ${requestId}, User: ${session.user.nickname}`);

      return NextResponse.json({
        success: true,
        requestId,
        message: '요청이 큐에 추가되었습니다. 처리 순서를 기다려주세요.'
      });

    } catch (queueError) {
      if (queueError instanceof Error && queueError.message.includes('2개의 요청을 처리 중')) {
        return NextResponse.json({ error: queueError.message }, { status: 429 });
      }
      throw queueError;
    }

  } catch (error) {
    console.error('Queue 요청 처리 에러:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

