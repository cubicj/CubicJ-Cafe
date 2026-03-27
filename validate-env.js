#!/usr/bin/env node

/**
 * CubicJ Cafe - 환경변수 검증 스크립트
 * Node.js 환경에서 직접 실행 가능한 환경변수 검증 도구
 */

const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  console.log('🔍 CubicJ Cafe 환경변수 검증 시작...\n');

  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';

  console.log(`📋 환경: ${NODE_ENV}`);
  console.log(`🏗️  프로덕션 모드: ${isProduction ? 'YES' : 'NO'}\n`);

  const errors = [];
  const warnings = [];

  // 필수 환경변수 검증
  function checkRequired(key, validator = null) {
    const value = process.env[key];
    if (!value) {
      if (isProduction) {
        errors.push(`❌ 필수 환경변수 누락: ${key}`);
      } else {
        warnings.push(`⚠️  환경변수 누락 (개발환경): ${key}`);
      }
      return false;
    }
    
    if (validator) {
      const validationResult = validator(value);
      if (validationResult !== true) {
        errors.push(`❌ ${key}: ${validationResult}`);
        return false;
      }
    }
    
    console.log(`✅ ${key}: 설정됨`);
    return true;
  }

  // 선택적 환경변수 검증
  function checkOptional(key, validator = null) {
    const value = process.env[key];
    if (!value) {
      console.log(`⚪ ${key}: 설정되지 않음 (선택사항)`);
      return false;
    }
    
    if (validator) {
      const validationResult = validator(value);
      if (validationResult !== true) {
        warnings.push(`⚠️  ${key}: ${validationResult}`);
        return false;
      }
    }
    
    console.log(`✅ ${key}: 설정됨`);
    return true;
  }

  // 검증 함수들
  const validators = {
    discordClientId: (value) => {
      if (isProduction && value.length < 10) {
        return '올바른 Discord Client ID 형식이 아닙니다';
      }
      return true;
    },
    
    discordClientSecret: (value) => {
      if (isProduction && value.length < 30) {
        return '올바른 Discord Client Secret 형식이 아닙니다';
      }
      return true;
    },
    
    url: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return '올바른 URL 형식이 아닙니다';
      }
    },
    
    integer: (value) => {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        return '정수 값이어야 합니다';
      }
      return true;
    },
    
    boolean: (value) => {
      if (!['true', 'false'].includes(value.toLowerCase())) {
        return 'true 또는 false 값이어야 합니다';
      }
      return true;
    },
    
    uploadSize: (value) => {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        return '정수 값이어야 합니다';
      }
      if (parsed > 52428800) {
        return '50MB (52428800 bytes)를 초과할 수 없습니다';
      }
      return true;
    },
    
    origins: (value) => {
      const origins = value.split(',').map(o => o.trim());
      
      for (const origin of origins) {
        try {
          new URL(origin);
        } catch {
          return `올바르지 않은 URL: ${origin}`;
        }
      }
      return true;
    }
  };

  console.log('🔐 보안 관련 환경변수:');
  checkRequired('APP_URL', validators.url);

  console.log('\n🎮 Discord OAuth2 설정:');
  checkRequired('DISCORD_CLIENT_ID', validators.discordClientId);
  checkRequired('DISCORD_CLIENT_SECRET', validators.discordClientSecret);
  
  console.log('\n🤖 Discord Bot 설정 (선택적):');
  checkOptional('DISCORD_BOT_TOKEN');
  checkOptional('DISCORD_GUILD_ID');
  checkOptional('DISCORD_CHANNEL_ID');
  
  console.log('\n🖥️  ComfyUI 연결:');
  checkRequired('COMFYUI_API_URL', validators.url);
  
  console.log('\n📊 데이터베이스:');
  checkRequired('DATABASE_URL');
  
  console.log('\n📁 파일 업로드 설정:');
  checkOptional('UPLOAD_MAX_SIZE', validators.uploadSize);
  checkOptional('UPLOAD_TEMP_DIR');
  
  console.log('\n🔧 추가 설정:');
  checkOptional('ALLOWED_ORIGINS', validators.origins);
  checkOptional('LOG_LEVEL');
  checkOptional('LOG_DIR');
  checkOptional('MAX_CONCURRENT_GENERATIONS', validators.integer);
  checkOptional('MEMORY_LIMIT', validators.integer);
  checkOptional('HEALTH_CHECK_INTERVAL', validators.integer);
  
  if (isProduction) {
    console.log('\n🏭 프로덕션 전용 설정:');
    checkOptional('BEHIND_PROXY', validators.boolean);
    checkOptional('TRUST_PROXY', validators.boolean);
    checkOptional('SSL_CERT_PATH');
    checkOptional('SSL_KEY_PATH');
  }

  // 환경변수 파일 존재 확인
  console.log('\n📄 환경변수 파일 확인:');
  const envFiles = ['.env.local', '.env', '.env.production'];
  let envFileFound = false;
  
  for (const envFile of envFiles) {
    if (fs.existsSync(path.join(process.cwd(), envFile))) {
      console.log(`✅ ${envFile}: 존재함`);
      envFileFound = true;
    } else {
      console.log(`⚪ ${envFile}: 없음`);
    }
  }
  
  if (!envFileFound) {
    warnings.push('⚠️  환경변수 파일이 없습니다. .env.local 또는 .env 파일을 생성하세요.');
  }

  // 프로덕션 전용 디렉토리 확인
  if (isProduction) {
    console.log('\n📂 프로덕션 디렉토리 확인:');
    const requiredDirs = [
      '/var/lib/cubicj-cafe',
      '/var/lib/cubicj-cafe/temp',
      '/var/log/cubicj-cafe',
      '/var/backups/cubicj-cafe'
    ];
    
    for (const dir of requiredDirs) {
      if (fs.existsSync(dir)) {
        console.log(`✅ ${dir}: 존재함`);
      } else {
        warnings.push(`⚠️  디렉토리 없음: ${dir} (mkdir -p ${dir} 로 생성하세요)`);
      }
    }
  }

  // 결과 출력
  console.log('\n' + '='.repeat(60));
  
  if (errors.length > 0) {
    console.log('\n❌ 검증 실패! 다음 오류들을 해결해주세요:\n');
    errors.forEach(error => console.log(error));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  경고 사항:\n');
    warnings.forEach(warning => console.log(warning));
  }
  
  if (errors.length === 0) {
    console.log('\n✅ 환경변수 검증 완료!');
    
    if (warnings.length === 0) {
      console.log('🎉 모든 설정이 완벽합니다!');
    } else {
      console.log('⚠️  경고 사항이 있지만 실행 가능합니다.');
    }
  } else {
    console.log(`\n🚫 ${errors.length}개의 오류로 인해 실행할 수 없습니다.`);
    process.exit(1);
  }
  
  console.log('\n📚 자세한 설정 가이드: PRODUCTION_ENV_GUIDE.md');
  console.log('='.repeat(60));
}

// 스크립트 실행
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };