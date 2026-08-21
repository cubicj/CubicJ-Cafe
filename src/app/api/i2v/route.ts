import { NextResponse } from 'next/server';
import { createRouteHandler, type AuthenticatedRequest } from '@/lib/api/route-handler';
import { QueueService, type QueueReferenceFileInput } from '@/lib/database/queue';
import { serverManager } from '@/lib/comfyui/server-manager';
import { randomUUID } from 'crypto';
import { GenerationMode, ReferenceKind, ServerType } from '@/generated/prisma/enums';
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry';
import type { VideoModel } from '@/lib/comfyui/workflows/types';
import { getModelSettings, getVideoDurationSeconds } from '@/lib/comfyui/workflows/model-settings';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { getEnabledModels } from '@/lib/database/system-settings';
import { parseFormData } from '@/lib/validations/parse';
import { i2vSchema } from '@/lib/validations/schemas/i2v';
import { ref2vaSchema } from '@/lib/validations/schemas/ref2va';
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

async function handleReferenceSubmission(
  req: AuthenticatedRequest,
  formData: FormData,
  selectedServer: { serverId: string; serverType: ServerType }
) {
  const formResult = parseFormData(ref2vaSchema, formData)
  if (!formResult.success) return formResult.response
  const validated = formResult.data

  const activeModel = validated.model as VideoModel
  const enabledModels = await getEnabledModels()
  if (!enabledModels.includes(activeModel)) {
    return NextResponse.json({ error: '선택한 모델은 현재 비활성화되어 있습니다.' }, { status: 400 })
  }

  const capabilities = MODEL_REGISTRY[activeModel].capabilities
  const modelSettings = await getModelSettings(activeModel)
  if (!modelSettings.durationOptions.includes(validated.videoDuration)) {
    return NextResponse.json(
      { error: `영상 길이는 ${modelSettings.durationOptions.join(', ')} 중 하나여야 합니다.` },
      { status: 400 }
    )
  }
  const videoDurationSeconds = getVideoDurationSeconds(activeModel, validated.videoDuration, modelSettings)

  const fileExtension = (name: string, fallback: string) =>
    name.includes('.') ? name.split('.').pop()! : fallback

  const referenceFiles: QueueReferenceFileInput[] = []
  for (const [slot, file] of validated.images.entries()) {
    referenceFiles.push({
      kind: ReferenceKind.IMAGE,
      slot,
      filename: `ref_img_${slot}_${randomUUID()}.${fileExtension(file.name, 'png')}`,
      blob: Buffer.from(await file.arrayBuffer()),
    })
  }
  for (const [slot, video] of validated.videos.entries()) {
    referenceFiles.push({
      kind: ReferenceKind.VIDEO,
      slot,
      filename: `ref_vid_${slot}_${randomUUID()}.${fileExtension(video.file.name, 'mp4')}`,
      blob: Buffer.from(await video.file.arrayBuffer()),
      includeSoundtrack: video.includeSoundtrack,
    })
  }
  for (const [slot, audio] of validated.audios.entries()) {
    if (audio.file) {
      referenceFiles.push({
        kind: ReferenceKind.AUDIO,
        slot,
        filename: `ref_aud_${slot}_${randomUUID()}.${fileExtension(audio.file.name, 'wav')}`,
        blob: Buffer.from(await audio.file.arrayBuffer()),
      })
      continue
    }
    const preset = await AudioPresetService.getPresetWithBlob(audio.presetId!, parseInt(req.user!.id))
    if (!preset) {
      return NextResponse.json({ error: '오디오 프리셋을 찾을 수 없습니다.' }, { status: 400 })
    }
    referenceFiles.push({
      kind: ReferenceKind.AUDIO,
      slot,
      filename: `ref_aud_${slot}_${randomUUID()}.${fileExtension(preset.audioFilename, 'wav')}`,
      blob: Buffer.from(preset.audioBlob),
      audioPresetName: preset.name,
    })
  }

  try {
    const requestId = await QueueService.createRequest({
      userId: parseInt(req.user!.id),
      nickname: req.user!.nickname,
      prompt: validated.prompt,
      isNSFW: capabilities.nsfw ? validated.isNSFW : false,
      serverType: selectedServer.serverType,
      serverId: selectedServer.serverId,
      videoModel: activeModel,
      generationMode: GenerationMode.REFERENCE,
      videoDuration: validated.videoDuration,
      videoDurationSeconds,
      referenceFiles,
      resolutionMode: validated.resolution.mode === 'custom' ? 'custom' : 'first_image',
      aspectWidth: validated.resolution.mode === 'custom' ? validated.resolution.aspectWidth : undefined,
      aspectHeight: validated.resolution.mode === 'custom' ? validated.resolution.aspectHeight : undefined,
    })

    log.info('Reference request queued', { requestId, user: req.user!.nickname, references: referenceFiles.length })

    return {
      requestId,
      message: '요청이 큐에 추가되었습니다. 처리 순서를 기다려주세요.',
    }
  } catch (queueError) {
    if (queueError instanceof Error && queueError.message.includes('2개의 요청을 처리 중')) {
      return NextResponse.json({ error: queueError.message }, { status: 429 })
    }
    throw queueError
  }
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
    const modelFields = formData.getAll('model')
    if (modelFields.length > 1) {
      return NextResponse.json({ error: 'model 필드는 하나여야 합니다.' }, { status: 400 })
    }
    const modelField = modelFields[0]
    if (
      typeof modelField === 'string' &&
      Object.hasOwn(MODEL_REGISTRY, modelField) &&
      MODEL_REGISTRY[modelField as VideoModel].capabilities.referenceInputs
    ) {
      return handleReferenceSubmission(req, formData, selectedServer)
    }
    const formResult = parseFormData(i2vSchema, formData);
    if (!formResult.success) return formResult.response;
    const validated = formResult.data;

    const activeModel = validated.model as VideoModel;
    const enabledModels = await getEnabledModels();
    if (!enabledModels.includes(activeModel)) {
      return NextResponse.json(
        { error: '선택한 모델은 현재 비활성화되어 있습니다.' },
        { status: 400 }
      );
    }

    const capabilities = MODEL_REGISTRY[activeModel].capabilities;

    const modelSettings = await getModelSettings(activeModel);
    const loraEnabled = capabilities.loraPresets && 'loraEnabled' in modelSettings && modelSettings.loraEnabled;

    const allowedDurations = modelSettings.durationOptions;
    if (!allowedDurations.includes(validated.videoDuration)) {
      return NextResponse.json(
        { error: `videoDuration must be one of ${allowedDurations.join(', ')}` },
        { status: 400 }
      );
    }

    const endImageFile = capabilities.endImage ? validated.endImage : undefined;
    const loraPresetData = loraEnabled ? validated.loraPreset : undefined;

    const { prompt, isNSFW, isLoop, videoDuration } = validated;
    const videoDurationSeconds = getVideoDurationSeconds(activeModel, videoDuration, modelSettings);
    const imageFile = validated.image;

    if (!imageFile && !endImageFile) {
      return NextResponse.json({ error: '이미지를 1장 이상 업로드해주세요' }, { status: 400 });
    }

    const generationMode = isLoop && imageFile && endImageFile
      ? GenerationMode.LOOP
      : imageFile && endImageFile
        ? GenerationMode.START_END
        : !imageFile
          ? GenerationMode.END_ONLY
          : GenerationMode.START_ONLY;

    log.debug('FormData parsed', {
      model: activeModel,
      prompt: prompt.substring(0, 50) + '...',
      imageFile: imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'null',
      endImageFile: endImageFile ? `${endImageFile.name} (${endImageFile.size} bytes)` : 'null',
      audioPresetId: validated.audioPresetId || 'null',
      hasLoraPreset: !!loraPresetData,
      isNSFW,
    });

    try {
      let imageBuffer = null;
      let tempFileName = null;
      if (imageFile) {
        imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const fileExtension = imageFile.name.split('.').pop() || 'png';
        tempFileName = `${randomUUID()}_${req.user!.id}_${Date.now()}.${fileExtension}`;
      }

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

      let endTempFileName = null;
      if (endImageBuffer && endImageFile) {
        const endFileExtension = endImageFile.name.split('.').pop() || 'png';
        endTempFileName = `end_${randomUUID()}_${req.user!.id}_${Date.now()}.${endFileExtension}`;
      }

      const requestId = await QueueService.createRequest({
        userId: parseInt(req.user!.id),
        nickname: req.user!.nickname,
        prompt: prompt.trim(),
        imageFile: tempFileName || undefined,
        imageBlob: imageBuffer || undefined,
        endImageFile: endTempFileName || undefined,
        endImageBlob: endImageBuffer || undefined,
        audioFile: audioTempFileName || undefined,
        audioBlob: audioBuffer || undefined,
        audioPresetName: audioPresetName || undefined,
        loraPreset: loraPresetData,
        isNSFW: capabilities.nsfw ? isNSFW : false,
        serverType: selectedServer.serverType,
        serverId: selectedServer.serverId,
        videoModel: activeModel,
        generationMode,
        videoDuration,
        videoDurationSeconds,
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
