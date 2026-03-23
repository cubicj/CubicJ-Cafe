import { prisma } from './prisma';
import type { User } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('database');

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
      log.error('User lookup failed', { error: error instanceof Error ? error.message : String(error) });
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
      log.error('Nickname lookup failed', { error: error instanceof Error ? error.message : String(error) });
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
      log.error('Nickname duplicate check failed', { error: error instanceof Error ? error.message : String(error) });
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

      return user;
    } catch (error) {
      log.error('User creation failed', { error: error instanceof Error ? error.message : String(error) });
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
      log.error('User update failed', { error: error instanceof Error ? error.message : String(error) });
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
      log.error('Login time update failed', { error: error instanceof Error ? error.message : String(error) });
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
      log.error('User deletion failed', { error: error instanceof Error ? error.message : String(error) });
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
      log.error('User list fetch failed', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }
}