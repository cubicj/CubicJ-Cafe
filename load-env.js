// ecosystem.config.js에서 환경변수를 로드하는 스크립트
// Prisma CLI 등에서 환경변수가 필요할 때 사용

try {
  const ecosystemConfig = require('./ecosystem.config.js');
  
  // NODE_ENV 설정
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  // PM2로 실행 중이거나 명시적으로 production이 설정된 경우 프로덕션 환경변수 사용
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.PM2_USAGE === 'CLI' ||
                      process.argv.includes('--env=production');
  
  const envConfig = isProduction
    ? ecosystemConfig.apps[0].env_production 
    : ecosystemConfig.apps[0].env;
  
  Object.keys(envConfig).forEach(key => {
    if (!process.env[key]) {
      process.env[key] = envConfig[key];
    }
  });
  
  console.log(`✅ 환경변수 로드 완료 (${isProduction ? 'production' : 'development'})`);
} catch (error) {
  console.warn('⚠️ ecosystem.config.js 로드 실패:', error);
}