import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { QueueService } from '@/lib/database/queue';
import { serverManager } from '@/lib/comfyui/server-manager';
import { randomUUID } from 'crypto';
import { ServerType, GenerationMode } from '@prisma/client';
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry';
import type { VideoModel } from '@/lib/comfyui/workflows/types';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { getWanSettings, getLtxSettings, getLtxWanSettings } from '@/lib/database/system-settings';
import { parseFormData } from '@/lib/validations/parse';
import { i2vSchema } from '@/lib/validations/schemas/i2v';
import { AudioPresetService } from '@/lib/database/audio-presets';

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

    let formData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    const formResult = parseFormData(i2vSchema, formData);
    if (!formResult.success) return formResult.response;
    const validated = formResult.data;

    const activeModel = validated.model as VideoModel;
    const capabilities = MODEL_REGISTRY[activeModel].capabilities;

    const modelSettings = activeModel === 'wan'
      ? await getWanSettings()
      : activeModel === 'ltx'
        ? await getLtxSettings()
        : await getLtxWanSettings();
    const loraEnabled = capabilities.loraPresets && 'loraEnabled' in modelSettings && modelSettings.loraEnabled;

    const settingsDurations = (modelSettings as { durationOptions?: number[] } | undefined)?.durationOptions;
    const allowedDurations = settingsDurations ?? MODEL_REGISTRY[activeModel].durationOptions;
    if (!allowedDurations.includes(validated.videoDuration)) {
      return NextResponse.json(
        { error: `videoDuration must be one of ${allowedDurations.join(', ')}` },
        { status: 400 }
      );
    }

    const endImageFile = capabilities.endImage ? validated.endImage : undefined;
    const loraPresetData = loraEnabled ? validated.loraPreset : undefined;

    const { prompt, isNSFW, isLoop, videoDuration } = validated;
    const imageFile = validated.image;

    const generationMode = isLoop
      ? GenerationMode.LOOP
      : endImageFile
        ? GenerationMode.START_END
        : GenerationMode.START_ONLY;

    log.debug('FormData parsed', {
      model: activeModel,
      prompt: prompt.substring(0, 50) + '...',
      imageFile: `${imageFile.name} (${imageFile.size} bytes)`,
      endImageFile: endImageFile ? `${endImageFile.name} (${endImageFile.size} bytes)` : 'null',
      audioPresetId: validated.audioPresetId || 'null',
      hasLoraPreset: !!loraPresetData,
      isNSFW,
    });

    try {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

      let endImageBuffer = null;
      if (capabilities.endImage && endImageFile) {
        endImageBuffer = Buffer.from(await endImageFile.arrayBuffer());
      }

      let audioBuffer = null;
      let audioTempFileName = null;
      let audioPresetName = null;
      if (capabilities.audio && validated.audioPresetId) {
        const audioPreset = await AudioPresetService.getPresetWithBlob(
          validated.audioPresetId,
          parseInt(req.user!.id)
        );
        if (audioPreset) {
          audioBuffer = Buffer.from(audioPreset.audioBlob);
          audioPresetName = audioPreset.name;
          const audioExtension = audioPreset.audioFilename.split('.').pop() || 'wav';
          audioTempFileName = `audio_${randomUUID()}_${req.user!.id}_${Date.now()}.${audioExtension}`;
        }
      }

      const fileExtension = imageFile.name.split('.').pop() || 'png';
      const tempFileName = `${randomUUID()}_${req.user!.id}_${Date.now()}.${fileExtension}`;

      let endTempFileName = null;
      if (endImageBuffer && endImageFile) {
        const endFileExtension = endImageFile.name.split('.').pop() || 'png';
        endTempFileName = `end_${randomUUID()}_${req.user!.id}_${Date.now()}.${endFileExtension}`;
      }

      const requestId = await QueueService.createRequest({
        userId: parseInt(req.user!.id),
        nickname: req.user!.nickname,
        prompt: prompt.trim(),
        imageFile: tempFileName,
        imageBlob: imageBuffer,
        endImageFile: endTempFileName || undefined,
        endImageBlob: endImageBuffer || undefined,
        audioFile: audioTempFileName || undefined,
        audioBlob: audioBuffer || undefined,
        audioPresetName: audioPresetName || undefined,
        loraPreset: loraPresetData,
        isNSFW: isNSFW,
        serverType: selectedServer.serverType,
        serverId: selectedServer.serverId,
        videoModel: activeModel,
        generationMode,
        videoDuration,
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
