import { prisma } from './prisma';
import type { LoRABundle } from '@prisma/client';

export interface CreateLoRABundleData {
  displayName: string;
  highLoRAFilename?: string;
  lowLoRAFilename?: string;
  order?: number;
}

export interface UpdateLoRABundleData {
  displayName?: string;
  highLoRAFilename?: string;
  lowLoRAFilename?: string;
  order?: number;
}

export class LoRABundleService {
  // 모든 번들 조회 (표시명 사전순으로 정렬)
  static async getActiveBundles(): Promise<LoRABundle[]> {
    try {
      const bundles = await prisma.loRABundle.findMany({
        orderBy: [
          { displayName: 'asc' },
        ],
      });

      return bundles;
    } catch (error) {
      console.error('❌ LoRA 번들 목록 조회 실패:', error);
      throw new Error('번들 목록 조회에 실패했습니다.');
    }
  }

  // 모든 번들 조회 (관리자용, 표시명 사전순 정렬)
  static async getAllBundles(): Promise<LoRABundle[]> {
    try {
      const bundles = await prisma.loRABundle.findMany({
        orderBy: [
          { displayName: 'asc' },
        ],
      });

      return bundles;
    } catch (error) {
      console.error('❌ 전체 LoRA 번들 조회 실패:', error);
      throw new Error('번들 조회에 실패했습니다.');
    }
  }

  // 특정 번들 조회
  static async getBundleById(bundleId: string): Promise<LoRABundle | null> {
    try {
      const bundle = await prisma.loRABundle.findUnique({
        where: {
          id: bundleId,
        },
      });

      return bundle;
    } catch (error) {
      console.error('❌ LoRA 번들 상세 조회 실패:', error);
      throw new Error('번들 조회에 실패했습니다.');
    }
  }

  // 번들 생성
  static async createBundle(data: CreateLoRABundleData): Promise<LoRABundle> {
    try {
      // 표시명 중복 확인
      const existingBundle = await prisma.loRABundle.findUnique({
        where: {
          displayName: data.displayName,
        },
      });

      if (existingBundle) {
        throw new Error('이미 존재하는 표시명입니다.');
      }

      // 적어도 하나의 LoRA 파일은 있어야 함
      if (!data.highLoRAFilename && !data.lowLoRAFilename) {
        throw new Error('High LoRA 또는 Low LoRA 중 적어도 하나는 필요합니다.');
      }

      const bundle = await prisma.loRABundle.create({
        data: {
          displayName: data.displayName,
          highLoRAFilename: data.highLoRAFilename || undefined,
          lowLoRAFilename: data.lowLoRAFilename || undefined,
          order: data.order || 0,
        },
      });

      console.log(`✅ LoRA 번들 생성 성공: ${bundle.displayName} (${bundle.id})`);
      return bundle;
    } catch (error) {
      console.error('❌ LoRA 번들 생성 실패:', error);
      throw new Error(error instanceof Error ? error.message : '번들 생성에 실패했습니다.');
    }
  }

  // 번들 수정
  static async updateBundle(bundleId: string, data: UpdateLoRABundleData): Promise<LoRABundle> {
    try {
      // 번들 존재 확인
      const existingBundle = await prisma.loRABundle.findUnique({
        where: { id: bundleId },
      });

      if (!existingBundle) {
        throw new Error('존재하지 않는 번들입니다.');
      }

      // 표시명이 변경되는 경우 중복 확인
      if (data.displayName && data.displayName !== existingBundle.displayName) {
        const duplicateBundle = await prisma.loRABundle.findUnique({
          where: { displayName: data.displayName },
        });

        if (duplicateBundle) {
          throw new Error('이미 존재하는 표시명입니다.');
        }
      }

      // 수정 후에도 적어도 하나의 LoRA 파일은 있어야 함
      const finalHighLoRA = data.highLoRAFilename !== undefined ? data.highLoRAFilename : existingBundle.highLoRAFilename;
      const finalLowLoRA = data.lowLoRAFilename !== undefined ? data.lowLoRAFilename : existingBundle.lowLoRAFilename;

      if (!finalHighLoRA && !finalLowLoRA) {
        throw new Error('High LoRA 또는 Low LoRA 중 적어도 하나는 필요합니다.');
      }

      const bundle = await prisma.loRABundle.update({
        where: { id: bundleId },
        data: {
          ...(data.displayName && { displayName: data.displayName }),
          ...(data.highLoRAFilename !== undefined && { highLoRAFilename: data.highLoRAFilename || undefined }),
          ...(data.lowLoRAFilename !== undefined && { lowLoRAFilename: data.lowLoRAFilename || undefined }),
          ...(data.order !== undefined && { order: data.order }),
        },
      });

      console.log(`✅ LoRA 번들 수정 성공: ${bundle.displayName} (${bundle.id})`);
      return bundle;
    } catch (error) {
      console.error('❌ LoRA 번들 수정 실패:', error);
      throw new Error(error instanceof Error ? error.message : '번들 수정에 실패했습니다.');
    }
  }

  // 번들 삭제
  static async deleteBundle(bundleId: string): Promise<boolean> {
    try {
      const bundle = await prisma.loRABundle.findUnique({
        where: { id: bundleId },
      });

      if (!bundle) {
        throw new Error('존재하지 않는 번들입니다.');
      }

      await prisma.loRABundle.delete({
        where: { id: bundleId },
      });

      console.log(`✅ LoRA 번들 삭제 성공: ${bundle.displayName} (${bundleId})`);
      return true;
    } catch (error) {
      console.error('❌ LoRA 번들 삭제 실패:', error);
      throw new Error(error instanceof Error ? error.message : '번들 삭제에 실패했습니다.');
    }
  }

  // LoRA 파일명으로 번들 찾기
  static async findBundleByLoRAFilename(filename: string): Promise<LoRABundle | null> {
    try {
      const bundle = await prisma.loRABundle.findFirst({
        where: {
          OR: [
            { highLoRAFilename: filename },
            { lowLoRAFilename: filename },
          ],
        },
      });

      return bundle;
    } catch (error) {
      console.error('❌ LoRA 파일명으로 번들 검색 실패:', error);
      return null;
    }
  }
}