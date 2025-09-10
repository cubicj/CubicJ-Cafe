import { prisma } from './prisma';
import type { LoRAPreset, LoRAPresetItem } from '@prisma/client';

export interface LoRAPresetWithItems extends LoRAPreset {
  loraItems: LoRAPresetItem[];
}

export interface CreateLoRAPresetData {
  name: string;
  isDefault?: boolean;
  isPublic?: boolean;
  loraItems: Array<{
    loraFilename: string;
    loraName: string;
    strength: number;
    group: 'HIGH' | 'LOW';
    order: number;
    bundleId?: string;
  }>;
}

export interface UpdateLoRAPresetData {
  name?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  loraItems?: Array<{
    loraFilename: string;
    loraName: string;
    strength: number;
    group: 'HIGH' | 'LOW';
    order: number;
    bundleId?: string;
  }>;
}

export class LoRAPresetService {
  // 사용자의 모든 프리셋 조회 (기본 프리셋 + 공개 프리셋 포함)
  static async getUserPresets(userId: number): Promise<LoRAPresetWithItems[]> {
    try {
      const presets = await prisma.loRAPreset.findMany({
        where: {
          OR: [
            { userId }, // 사용자가 만든 프리셋
            { isPublic: true }, // 공개 프리셋
            { isDefault: true }, // 기본 프리셋
          ],
        },
        include: {
          loraItems: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [
          { isPublic: 'desc' },  // 공개 프리셋 우선
          { order: 'asc' },      // 순서대로
          { createdAt: 'asc' },   // 오래된 것부터 (새 프리셋이 아래로)
        ],
      });

      return presets;
    } catch (error) {
      console.error('❌ LoRA 프리셋 조회 실패:', error);
      throw new Error('프리셋 조회에 실패했습니다.');
    }
  }

  // 특정 프리셋 조회
  static async getPresetById(presetId: string, userId?: number): Promise<LoRAPresetWithItems | null> {
    try {
      const preset = await prisma.loRAPreset.findFirst({
        where: {
          id: presetId,
          OR: [
            { userId: userId || 0 }, // 사용자가 만든 프리셋
            { isPublic: true },      // 공개 프리셋
            { isDefault: true },     // 기본 프리셋
          ],
        },
        include: {
          loraItems: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (preset) {
        console.log(`✅ LoRA 프리셋 상세 조회 성공: ${presetId}`);
      }
      return preset;
    } catch (error) {
      console.error('❌ LoRA 프리셋 상세 조회 실패:', error);
      throw new Error('프리셋 조회에 실패했습니다.');
    }
  }

  // 프리셋 생성
  static async createPreset(userId: number, data: CreateLoRAPresetData): Promise<LoRAPresetWithItems> {
    try {
      const preset = await prisma.loRAPreset.create({
        data: {
          userId,
          name: data.name,
          isDefault: data.isDefault || false,
          isPublic: data.isPublic || false,
          loraItems: {
            create: data.loraItems.map((item, index) => ({
              loraFilename: item.loraFilename,
              loraName: item.loraName,
              strength: item.strength,
              group: item.group,
              order: item.order || index,
              bundleId: item.bundleId || null,
            })),
          },
        },
        include: {
          loraItems: {
            orderBy: { order: 'asc' },
          },
        },
      });

      console.log(`✅ LoRA 프리셋 생성 성공: ${preset.name} (${preset.id})`);
      return preset;
    } catch (error) {
      console.error('❌ LoRA 프리셋 생성 실패:', error);
      throw new Error('프리셋 생성에 실패했습니다.');
    }
  }

  // 프리셋 수정
  static async updatePreset(
    presetId: string,
    userId: number,
    data: UpdateLoRAPresetData
  ): Promise<LoRAPresetWithItems | null> {
    try {
      // 먼저 수정 권한 확인
      const existingPreset = await prisma.loRAPreset.findFirst({
        where: {
          id: presetId,
          userId, // 본인이 만든 프리셋만 수정 가능
        },
      });

      if (!existingPreset) {
        throw new Error('수정 권한이 없거나 존재하지 않는 프리셋입니다.');
      }

      // LoRA 아이템이 있으면 기존 아이템들 삭제 후 새로 생성
      if (data.loraItems) {
        await prisma.loRAPresetItem.deleteMany({
          where: { presetId },
        });
      }

      const preset = await prisma.loRAPreset.update({
        where: { id: presetId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
          ...(data.loraItems && {
            loraItems: {
              create: data.loraItems.map((item, index) => ({
                loraFilename: item.loraFilename,
                loraName: item.loraName,
                strength: item.strength,
                group: item.group,
                order: item.order || index,
                bundleId: item.bundleId || null,
              })),
            },
          }),
        },
        include: {
          loraItems: {
            orderBy: { order: 'asc' },
          },
        },
      });

      console.log(`✅ LoRA 프리셋 수정 성공: ${preset.name} (${preset.id})`);
      return preset;
    } catch (error) {
      console.error('❌ LoRA 프리셋 수정 실패:', error);
      throw new Error(error instanceof Error ? error.message : '프리셋 수정에 실패했습니다.');
    }
  }

  // 프리셋 삭제
  static async deletePreset(presetId: string, userId: number): Promise<boolean> {
    try {
      // 삭제 권한 확인
      const preset = await prisma.loRAPreset.findFirst({
        where: {
          id: presetId,
          userId, // 본인이 만든 프리셋만 삭제 가능
        },
      });

      if (!preset) {
        throw new Error('삭제 권한이 없거나 존재하지 않는 프리셋입니다.');
      }

      await prisma.loRAPreset.delete({
        where: { id: presetId },
      });

      console.log(`✅ LoRA 프리셋 삭제 성공: ${preset.name} (${presetId})`);
      return true;
    } catch (error) {
      console.error('❌ LoRA 프리셋 삭제 실패:', error);
      throw new Error(error instanceof Error ? error.message : '프리셋 삭제에 실패했습니다.');
    }
  }

  // 기본 프리셋들 생성 (시스템 초기화용)
  static async createDefaultPresets(): Promise<void> {
    try {
      const defaultPresets = [
        {
          name: '없음',
          isDefault: true,
          isPublic: true,
        },
        {
          name: '애니메이션 스타일',
          isDefault: true,
          isPublic: true,
        },
        {
          name: '사실적 인물',
          isDefault: true,
          isPublic: true,
        },
      ];

      for (const presetData of defaultPresets) {
        const existing = await prisma.loRAPreset.findFirst({
          where: {
            name: presetData.name,
            isDefault: true,
          },
        });

        if (!existing) {
          await prisma.loRAPreset.create({
            data: {
              userId: 1, // 시스템 관리자 ID (존재한다고 가정)
              ...presetData,
            },
          });
          console.log(`✅ 기본 프리셋 생성: ${presetData.name}`);
        }
      }
    } catch (error) {
      console.error('❌ 기본 프리셋 생성 실패:', error);
    }
  }
}