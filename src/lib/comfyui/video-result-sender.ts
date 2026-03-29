import { QueueService } from '@/lib/database/queue';
import { GenerationJob } from '@/types';
import { discordBot } from '../discord-bot';
import { serverManager } from './server-manager';
import { VIDEO_OUTPUT_TYPES, MODEL_REGISTRY } from './workflows/registry';
import type { VideoModel } from './workflows/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('comfyui');

interface ComfyUINodeOutput {
  error?: string;
  exception?: string;
  gifs?: Array<{ filename: string; subfolder?: string }>;
}

interface ComfyUIPromptItem {
  error?: string;
  [nodeId: string]: unknown;
}

interface ComfyUIWorkflowNode {
  class_type?: string;
  inputs?: Record<string, unknown> & {
    filename_prefix?: string;
  };
}

export async function sendVideoToDiscord(
  job: GenerationJob,
  outputs: Record<string, ComfyUINodeOutput>
): Promise<void> {
  try {
    if (!job.userInfo) {
      log.warn('No user info, skipping Discord send', { jobId: job.id });
      return;
    }

    const videoModel = (job.videoModel as VideoModel) || 'wan';
    const outputConfig = VIDEO_OUTPUT_TYPES[videoModel];
    const modelConfig = MODEL_REGISTRY[videoModel];

    log.debug('Discord send outputs structure', {
      jobId: job.id,
      videoModel,
      outputField: outputConfig.outputField,
      nodeIds: Object.keys(outputs),
      outputStructure: Object.fromEntries(
        Object.entries(outputs).map(([nodeId, nodeOutput]) => [
          nodeId,
          Object.keys(nodeOutput as Record<string, unknown>)
        ])
      )
    });

    let videoFound = false;
    for (const [, nodeOutput] of Object.entries(outputs)) {
      const outputFiles = (nodeOutput as Record<string, unknown>)[outputConfig.outputField] as Array<{ filename: string; subfolder?: string; type?: string }> | undefined;
      if (outputFiles && outputFiles.length > 0) {
        const video = outputFiles[0];
        videoFound = true;

        const { server } = await resolveServer(job.id);

        const processingTime = job.updatedAt && job.createdAt
          ? Math.round((job.updatedAt.getTime() - job.createdAt.getTime()) / 1000)
          : undefined;

        log.debug('Discord video send started', {
          jobId: job.id,
          videoFile: video.filename,
          videoModel,
          serverUrl: server.url
        });

        await discordBot.sendVideoToDiscord({
          filename: video.filename,
          subfolder: video.subfolder || '',
          fileType: video.type || 'output',
          prompt: job.prompt,
          username: job.userInfo.name,
          userAvatar: job.userInfo.image,
          processingTime,
          isNSFW: job.isNSFW,
          discordId: job.userInfo.discordId,
          comfyUIServerUrl: server.url,
          videoModel
        });

        log.debug('Discord video send complete', { jobId: job.id });
        break;
      }
    }

    if (!videoFound) {
      await sendVideoByFilenameExtraction(job, videoModel, outputConfig, modelConfig);
    }
  } catch (error) {
    log.error('Discord video send failed', { error: error instanceof Error ? error.message : String(error) });
  }
}

async function resolveServer(jobId: string) {
  const queueRequest = await QueueService.getRequestById(jobId);
  if (!queueRequest?.serverId) {
    throw new Error('서버 정보를 찾을 수 없습니다');
  }

  const server = serverManager.getServerById(queueRequest.serverId);
  if (!server) {
    throw new Error(`서버를 찾을 수 없습니다: ${queueRequest.serverId}`);
  }

  return { queueRequest, server };
}

async function sendVideoByFilenameExtraction(
  job: GenerationJob,
  videoModel: string,
  outputConfig: { outputField: string; classTypes: string[] },
  modelConfig: { defaultSubfolder: string }
): Promise<void> {
  log.debug('No output field, attempting filename extraction from history', { jobId: job.id });

  const { server } = await resolveServer(job.id);
  const comfyUIClient = serverManager.getClient(server);

  try {
    const history = await comfyUIClient.getHistory(job.promptId!);
    const promptData = history[job.promptId!];

    if (!promptData) {
      log.warn('No prompt data found in history');
      return;
    }

    const videoInfo = extractVideoInfo(promptData, outputConfig.classTypes, modelConfig.defaultSubfolder);
    if (!videoInfo) {
      log.warn('No video output node found in history');
      return;
    }

    log.debug('Discord send with extracted filename', { jobId: job.id, ...videoInfo, serverUrl: server.url });

    const processingTime = job.updatedAt && job.createdAt
      ? Math.round((job.updatedAt.getTime() - job.createdAt.getTime()) / 1000)
      : undefined;

    await discordBot.sendVideoToDiscord({
      filename: videoInfo.filename,
      subfolder: modelConfig.defaultSubfolder,
      fileType: videoInfo.fileType,
      prompt: job.prompt,
      username: job.userInfo!.name,
      userAvatar: job.userInfo!.image,
      processingTime,
      isNSFW: job.isNSFW,
      discordId: job.userInfo!.discordId,
      comfyUIServerUrl: server.url,
      videoModel
    });

    log.debug('Discord send with extracted filename complete', { jobId: job.id });
  } catch (error) {
    log.error('Filename extraction failed, skipping Discord send', { jobId: job.id, error: error instanceof Error ? error.message : String(error) });
  }
}

interface ExtractedVideoInfo {
  filename: string;
  fileType: 'output' | 'temp';
}

function extractVideoInfo(
  promptData: { prompt?: ComfyUIPromptItem[] },
  classTypes: string[],
  defaultSubfolder: string
): ExtractedVideoInfo | null {
  if (!promptData.prompt || !Array.isArray(promptData.prompt)) return null;

  for (const promptItem of promptData.prompt) {
    if (!promptItem || typeof promptItem !== 'object') continue;
    for (const [nodeId, nodeData] of Object.entries(promptItem)) {
      if (!nodeData || typeof nodeData !== 'object') continue;
      const node = nodeData as ComfyUIWorkflowNode;
      if (!node.class_type || !classTypes.includes(node.class_type)) continue;
      const filenamePrefix = node.inputs?.filename_prefix;
      if (!filenamePrefix || typeof filenamePrefix !== 'string') continue;
      const subfolderPattern = new RegExp('^' + defaultSubfolder + '/');
      const baseFilename = filenamePrefix.replace(subfolderPattern, '');
      const saveOutput = node.inputs?.save_output;
      const fileType = saveOutput === false ? 'temp' : 'output';
      const filename = `${baseFilename}_00001_.mp4`;
      log.debug('Video info extracted from node', {
        nodeId,
        classType: node.class_type,
        filenamePrefix,
        saveOutput,
        fileType,
        filename,
      });
      return { filename, fileType };
    }
  }

  return null;
}
