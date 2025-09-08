// 간단한 인메모리 사용자 저장소 (실제 프로덕션에서는 데이터베이스 사용)
import { User } from '@/types';
import { randomUUID } from 'crypto';

class UserStore {
  private users: Map<string, User> = new Map();

  // 사용자 조회 (Discord ID로)
  getUser(discordId: string): User | null {
    return this.users.get(discordId) || null;
  }

  // 사용자 생성
  createUser(data: {
    discordId: string;
    discordUsername: string;
    nickname: string;
    avatar?: string;
  }): User {
    const user: User = {
      id: randomUUID(),
      ...data,
      avatar: data.avatar || null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    
    this.users.set(data.discordId, user);
    return user;
  }

  // 사용자 업데이트
  updateUser(discordId: string, updates: Partial<User>): User | null {
    const user = this.users.get(discordId);
    if (!user) return null;

    const updatedUser = { ...user, ...updates, lastLoginAt: new Date().toISOString() };
    this.users.set(discordId, updatedUser);
    return updatedUser;
  }

  // 닉네임 설정
  setNickname(discordId: string, nickname: string): User | null {
    return this.updateUser(discordId, { nickname });
  }

  // 닉네임 중복 확인
  isNicknameExists(nickname: string): boolean {
    return Array.from(this.users.values()).some(user => user.nickname === nickname);
  }

  // 모든 사용자 조회 (개발용)
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

// 싱글톤 인스턴스
export const userStore = new UserStore();
export type { User };