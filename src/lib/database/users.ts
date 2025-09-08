import { prisma } from './prisma';
import type { User } from '@prisma/client';
import { LoRAPresetService } from './lora-presets';

// 사용자 생성 타입
export interface CreateUserData {
  discordId: string;
  discordUsername: string;
  nickname: string;
  avatar?: string;
}

// 사용자 업데이트 타입
export interface UpdateUserData {
  discordUsername?: string;
  nickname?: string;
  avatar?: string;
  lastLoginAt?: Date;
}

// 사용자 서비스 클래스
export class UserService {
  // Discord ID로 사용자 조회
  static async findByDiscordId(discordId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { discordId },
      });
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      return null;
    }
  }

  // 닉네임으로 사용자 조회
  static async findByNickname(nickname: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { nickname },
      });
    } catch (error) {
      console.error('닉네임 조회 실패:', error);
      return null;
    }
  }

  // 닉네임 중복 확인
  static async isNicknameExists(nickname: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { nickname },
      });
      return user !== null;
    } catch (error) {
      console.error('닉네임 중복 확인 실패:', error);
      return true; // 에러 시 중복으로 간주
    }
  }

  // 새 사용자 생성
  static async create(userData: CreateUserData): Promise<User | null> {
    try {
      const user = await prisma.user.create({
        data: {
          discordId: userData.discordId,
          discordUsername: userData.discordUsername,
          nickname: userData.nickname,
          avatar: userData.avatar,
        },
      });

      // 새 사용자를 위한 기본 LoRA 프리셋 생성
      if (user) {
        try {
          await LoRAPresetService.createPreset(user.id, {
            name: '베이스 가속로라',
            isDefault: false,
            isPublic: false,
            loraItems: [
              {
                loraFilename: 'WAN\\High\\Wan2.2-I2V-A14B-4steps-lora-rank64-Seko-V1-High.safetensors',
                loraName: 'Lightning - Seko (High)',
                strength: 0.5,
                group: 'HIGH',
                order: 0,
              },
              {
                loraFilename: 'WAN\\Low\\Wan2.2-I2V-A14B-4steps-lora-rank64-Seko-V1-Low.safetensors',
                loraName: 'Lightning - Seko (Low)',
                strength: 0.9,
                group: 'LOW',
                order: 1,
              },
            ],
          });
          console.log(`✅ 새 사용자 ${userData.nickname}을 위한 기본 LoRA 프리셋 생성 완료`);
        } catch (presetError) {
          console.error('❌ 기본 LoRA 프리셋 생성 실패:', presetError);
        }
      }

      return user;
    } catch (error) {
      console.error('사용자 생성 실패:', error);
      return null;
    }
  }

  // 사용자 정보 업데이트
  static async update(discordId: string, updateData: UpdateUserData): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { discordId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('사용자 업데이트 실패:', error);
      return null;
    }
  }

  // 마지막 로그인 시간 업데이트
  static async updateLastLogin(discordId: string): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { discordId },
        data: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('로그인 시간 업데이트 실패:', error);
      return null;
    }
  }

  // 사용자 삭제
  static async delete(discordId: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { discordId },
      });
      return true;
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      return false;
    }
  }

  // 모든 사용자 조회 (관리자용)
  static async findAll(): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      return [];
    }
  }
}