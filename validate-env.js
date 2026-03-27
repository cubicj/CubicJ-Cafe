#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  console.log('CubicJ Cafe environment validation\n');

  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';

  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Production mode: ${isProduction ? 'YES' : 'NO'}\n`);

  const errors = [];
  const warnings = [];

  function checkRequired(key, validator = null) {
    const value = process.env[key];
    if (!value) {
      if (isProduction) {
        errors.push(`[ERROR] Missing required: ${key}`);
      } else {
        warnings.push(`[WARN] Missing (dev): ${key}`);
      }
      return false;
    }

    if (validator) {
      const validationResult = validator(value);
      if (validationResult !== true) {
        errors.push(`[ERROR] ${key}: ${validationResult}`);
        return false;
      }
    }

    console.log(`  [OK] ${key}`);
    return true;
  }

  function checkOptional(key, validator = null) {
    const value = process.env[key];
    if (!value) {
      console.log(`  [--] ${key} (optional, not set)`);
      return false;
    }

    if (validator) {
      const validationResult = validator(value);
      if (validationResult !== true) {
        warnings.push(`[WARN] ${key}: ${validationResult}`);
        return false;
      }
    }

    console.log(`  [OK] ${key}`);
    return true;
  }

  const validators = {
    discordClientId: (value) => {
      if (isProduction && value.length < 10) {
        return 'Invalid Discord Client ID format';
      }
      return true;
    },

    discordClientSecret: (value) => {
      if (isProduction && value.length < 30) {
        return 'Invalid Discord Client Secret format';
      }
      return true;
    },

    url: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return 'Invalid URL format';
      }
    },

    uploadSize: (value) => {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        return 'Must be an integer';
      }
      if (parsed > 52428800) {
        return 'Cannot exceed 50MB (52428800 bytes)';
      }
      return true;
    },
  };

  console.log('Security:');
  checkRequired('APP_URL', validators.url);

  console.log('\nDiscord OAuth2:');
  checkRequired('DISCORD_CLIENT_ID', validators.discordClientId);
  checkRequired('DISCORD_CLIENT_SECRET', validators.discordClientSecret);

  console.log('\nDiscord Bot (optional):');
  checkOptional('DISCORD_BOT_TOKEN');
  checkOptional('DISCORD_GUILD_ID');
  checkOptional('DISCORD_CHANNEL_ID');

  console.log('\nComfyUI:');
  checkRequired('COMFYUI_API_URL', validators.url);

  console.log('\nDatabase:');
  checkRequired('DATABASE_URL');

  console.log('\nFile Upload:');
  checkOptional('UPLOAD_MAX_SIZE', validators.uploadSize);
  checkOptional('UPLOAD_TEMP_DIR');

  console.log('\nLogging:');
  checkOptional('LOG_LEVEL');
  checkOptional('LOG_DIR');

  console.log('\nEnv files:');
  const envFiles = ['.env.local', '.env', '.env.production'];
  let envFileFound = false;

  for (const envFile of envFiles) {
    if (fs.existsSync(path.join(process.cwd(), envFile))) {
      console.log(`  [OK] ${envFile}`);
      envFileFound = true;
    } else {
      console.log(`  [--] ${envFile} (not found)`);
    }
  }

  if (!envFileFound) {
    warnings.push('[WARN] No env file found. Create .env.local or .env');
  }

  console.log('\n' + '='.repeat(60));

  if (errors.length > 0) {
    console.log('\nValidation failed:\n');
    errors.forEach(error => console.log(error));
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:\n');
    warnings.forEach(warning => console.log(warning));
  }

  if (errors.length === 0) {
    console.log('\nValidation passed.');

    if (warnings.length === 0) {
      console.log('All settings are valid.');
    } else {
      console.log('Warnings present but runnable.');
    }
  } else {
    console.log(`\n${errors.length} error(s) found. Cannot start.`);
    process.exit(1);
  }

  console.log('='.repeat(60));
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };
