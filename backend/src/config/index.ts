import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

const config = {
  PORT: parseInt(getEnv('PORT', '5000'), 10),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:3000'),
  PUBLIC_BASE_URL: getEnv('PUBLIC_BASE_URL', 'http://localhost:3000'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  ADMIN_EMAIL: getEnv('ADMIN_EMAIL', 'admin@ssrinstitute.in'),
  ADMIN_PASSWORD: getEnv('ADMIN_PASSWORD', 'Admin@12345'),
  ADMIN_NAME: getEnv('ADMIN_NAME', 'Super Admin'),
  UPLOAD_DIR: getEnv('UPLOAD_DIR', './src/uploads'),
  MAX_FILE_SIZE: parseInt(getEnv('MAX_FILE_SIZE', String(5 * 1024 * 1024)), 10),
};

export default config;
