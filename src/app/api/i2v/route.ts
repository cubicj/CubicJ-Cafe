import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { QueueService } from '@/lib/database/queue';
import { serverManager } from '@/lib/comfyui/server-manager';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { ServerType } from '@prisma/client';
import { getActiveModel } from '@/lib/database/model-settings';
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { parseFormData } from '@/lib/validations/parse';
import { i2vSchema } from '@/lib/validations/schemas/i2v';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

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

export const POST = createRouteHandler(
  { auth: 'user' },
  async (req) => {
    log.debug('I2V API request started', {
      method: req.method,
      url: req.url,
      contentType: req.headers.get('content-type'),
      contentLength: req.headers.get('content-length')
    });

    if (!isComfyUIEnabled()) {
      return NextResponse.json(
        { error: 'ComfyUI 서버가 비활성 상태입니다.' },
        { status: 503 }
      );
    }

    const selectedServer = await selectBestServer();
    if (!selectedServer) {
      log.warn('Server selection failed: no available ComfyUI servers.');
      return NextResponse.json({
        error: '현재 사용 가능한 서버가 없습니다. 잠시 후 다시 시도해주세요.'
      }, { status: 503 });
    }

    log.debug('Server selected', {
      serverId: selectedServer.serverId,
      serverType: selectedServer.serverType,
      url: selectedServer.url
    });

    const activeModel = await getActiveModel();
    const capabilities = MODEL_REGISTRY[activeModel].capabilities;

    let formData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    const formResult = parseFormData(i2vSchema, formData);
    if (!formResult.success) return formResult.response;
    const validated = formResult.data;

    const endImageFile = capabilities.endImage ? validated.endImage : undefined;
    const loraName = capabilities.loraPresets ? validated.lora : undefined;
    const loraStrength = capabilities.loraPresets ? validated.loraStrength : 0;
    const loraPresetData = capabilities.loraPresets ? validated.loraPreset : undefined;

    const { prompt, isNSFW } = validated;
    const imageFile = validated.image;
    const workflowLength = 16 * validated.duration + 1;

    log.debug('FormData parsed', {
      prompt: prompt.substring(0, 50) + '...',
      imageFile: `${imageFile.name} (${imageFile.size} bytes)`,
      endImageFile: endImageFile ? `${endImageFile.name} (${endImageFile.size} bytes)` : 'null',
      loraName,
      loraStrength,
      hasLoraPreset: !!loraPresetData,
      isNSFW,
      duration: validated.duration,
      workflowLength
    });

    try {
      const tempDir = join(process.cwd(), 'public', 'temp')
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true })
      }

      const uuid = randomUUID()
      const timestamp = Date.now()
      const userId = req.user!.id
      const fileExtension = imageFile.name.split('.').pop() || 'png'
      const tempFileName = `${uuid}_${userId}_${timestamp}.${fileExtension}`
      const tempFilePath = join(tempDir, tempFileName)

      const imageBuffer = await imageFile.arrayBuffer()
      await writeFile(tempFilePath, Buffer.from(imageBuffer))

      log.debug('Start image temp file saved', {
        originalName: imageFile.name,
        tempFileName,
        size: imageFile.size
      })

      let endTempFileName = null
      let endTempFilePath = null
      if (capabilities.endImage && endImageFile) {
        const endUuid = randomUUID()
        const endFileExtension = endImageFile.name.split('.').pop() || 'png'
        endTempFileName = `end_${endUuid}_${userId}_${timestamp}.${endFileExtension}`
        endTempFilePath = join(tempDir, endTempFileName)

        const endImageBuffer = await endImageFile.arrayBuffer()
        await writeFile(endTempFilePath, Buffer.from(endImageBuffer))

        log.debug('End image temp file saved', {
          originalName: endImageFile.name,
          tempFileName: endTempFileName,
          size: endImageFile.size
        })
      }

      const requestId = await QueueService.createRequest({
        userId: parseInt(req.user!.id),
        nickname: req.user!.nickname,
        prompt: prompt.trim(),
        imageFile: tempFileName,
        imagePath: tempFilePath,
        endImageFile: endTempFileName || undefined,
        endImagePath: endTempFilePath || undefined,
        lora: loraName && loraName !== 'none' ? loraName : undefined,
        loraStrength: loraName && loraName !== 'none' ? loraStrength : undefined,
        loraPreset: loraPresetData,
        isNSFW: isNSFW,
        duration: validated.duration,
        workflowLength: workflowLength,
        serverType: selectedServer.serverType,
        serverId: selectedServer.serverId,
        videoModel: activeModel
      });

      log.info('Request queued', { requestId, user: req.user!.nickname });

      return {
        requestId,
        message: '요청이 큐에 추가되었습니다. 처리 순서를 기다려주세요.'
      };

    } catch (queueError) {
      if (queueError instanceof Error && queueError.message.includes('2개의 요청을 처리 중')) {
        return NextResponse.json({ error: queueError.message }, { status: 429 });
      }
      throw queueError;
    }
  }
);
