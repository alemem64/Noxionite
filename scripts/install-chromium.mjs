#!/usr/bin/env node

import { existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Checking for Chromium installation...');

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('📦 Setting up Chromium for Vercel environment...');
  
  // In Vercel, we don't need to install Chromium via apt-get
  // @sparticuz/chromium will handle the browser installation
  // We just need to ensure the environment variables are set correctly
  
  const chromiumPaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/tmp/chromium'
  ];
  
  let foundPath = null;
  for (const path of chromiumPaths) {
    if (existsSync(path)) {
      foundPath = path;
      break;
    }
  }
  
  if (foundPath) {
    console.log(`✅ Found Chromium at: ${foundPath}`);
    process.env.PUPPETEER_EXECUTABLE_PATH = foundPath;
  } else {
    console.log('ℹ️  Using @sparticuz/chromium for serverless environment');
  }
  
  // Set environment variables for Puppeteer
  process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = '1';
  
} else {
  console.log('🖥️  Local environment detected, skipping Chromium installation');
}

console.log('🚀 Chromium setup complete');

// Exit successfully
process.exit(0);