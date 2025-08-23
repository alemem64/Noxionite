#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🔍 Checking for Chromium installation...');

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('📦 Installing Chromium for Vercel environment...');
  
  try {
    // Try to install chromium-browser via apt
    execSync('apt-get update && apt-get install -y chromium-browser', { 
      stdio: 'inherit',
      timeout: 30000 
    });
    console.log('✅ Chromium installed successfully');
  } catch (error) {
    console.log('⚠️  Could not install chromium via apt, trying alternatives...');
    
    // Check if chromium is already available
    const chromiumPaths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium'
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
      console.log('⚠️  Chromium not found, will use @sparticuz/chromium');
    }
  }
} else {
  console.log('🖥️  Local environment detected, skipping Chromium installation');
}

console.log('🚀 Chromium setup complete');