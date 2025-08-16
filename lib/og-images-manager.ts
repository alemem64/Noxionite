import type { SiteMap, PageInfo } from './context/types'
import { buildTagGraphData } from './context/tag-graph';
// Interface for SocialCard props - matches SocialCard component
interface SocialCardProps {
  url: string;
  siteMap?: any;
  imageUrl?: string;
  baseUrl?: string;
}

// Dynamic imports for server-side only modules
let React: any
let ReactDOMServer: any
let fs: any
let fsSync: any
let path: any
let SocialCard: any
let siteConfig: any
let localeConfig: any

// Lazy load server-side modules
async function loadServerModules() {
  if (!React) {
    React = await import('react')
  }
  if (!ReactDOMServer) {
    ReactDOMServer = await import('react-dom/server')
  }
  if (!fs) {
    fs = await import('node:fs/promises')
  }
  if (!fsSync) {
    fsSync = await import('node:fs')
  }
  if (!path) {
    // eslint-disable-next-line unicorn/import-style
    path = await import('node:path')
  }
  if (!SocialCard) {
    const mod = await import('../components/SocialCard')
    SocialCard = mod.SocialCard
  }
  if (!siteConfig) {
    siteConfig = (await import('../site.config.ts')).default
  }
  if (!localeConfig) {
    localeConfig = (await import('../site.locale.json')).default
  }
}

// Browser instance cache for reuse
let cachedBrowser: any | null = null
let browserPromise: Promise<any> | null = null

// Get or create browser instance
export async function getBrowser(): Promise<any> {
  if (cachedBrowser && cachedBrowser.isConnected()) {
    return cachedBrowser
  }

  if (browserPromise) {
    return browserPromise
  }

  await loadServerModules()

  const isProductionServerless = (process.env.VERCEL === '1' || process.env.NETLIFY === 'true') || 
                                process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

  let puppeteer: any;
  let chromium: any;

  if (isProductionServerless) {
    console.log('[getBrowser] Loading modules for serverless environment');
    try {
      const chromiumModule = await import('@sparticuz/chromium');
      chromium = chromiumModule.default || chromiumModule;
      const puppeteerCore = await import('puppeteer-core');
      puppeteer = puppeteerCore.default || puppeteerCore;
    } catch (err) {
      console.error('[getBrowser] Error loading serverless modules:', err);
      throw err;
    }
  } else {
    console.log('[getBrowser] Loading full puppeteer for local environment');
    try {
      const puppeteerBundled = await import('puppeteer');
      puppeteer = puppeteerBundled.default || puppeteerBundled;
    } catch (err) {
      console.error('[getBrowser] Error loading local puppeteer:', err);
      throw err;
    }
  }

  try {
    console.log(`[getBrowser] isProductionServerless: ${isProductionServerless}`);

    let browser;
    if (isProductionServerless && chromium) {
      console.log('[getBrowser] Using @sparticuz/chromium for serverless environment.');
      // ... (keep the serverless launch logic as is)
      const chromiumInstance = chromium.default || chromium;
      let executablePath = await chromiumInstance.executablePath;
      if (!executablePath) {
        executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      if (!executablePath) {
        throw new Error('Could not determine Chromium executable path');
      }
      const launchArgs = [...chromiumInstance.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'];
      const env = {
        ...process.env,
        LD_LIBRARY_PATH: `/var/task/lib:${process.env.LD_LIBRARY_PATH || ''}`,
        FONTCONFIG_PATH: '/var/task/fonts',
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
        PUPPETEER_EXECUTABLE_PATH: executablePath,
      };
      const launchConfig = {
        args: launchArgs,
        executablePath,
        headless: chromiumInstance.headless,
        ignoreHTTPSErrors: true,
        env,
      };
      try {
        browser = await puppeteer.launch(launchConfig);
      } catch (err) {
        if ((err as Error).message.includes('libnss3.so')) {
          const minimalArgs = ['--no-sandbox', '--single-process', '--disable-dev-shm-usage', '--disable-gpu', '--disable-web-security', '--no-first-run', '--disable-features=VizDisplayCompositor'];
          launchConfig.args = minimalArgs;
          launchConfig.headless = true;
          browser = await puppeteer.launch(launchConfig);
        } else {
          throw err;
        }
      }
    } else {
      console.log('[getBrowser] Using local puppeteer-bundled browser.');
      const executablePath = puppeteer.executablePath();
      if (!executablePath) {
        throw new Error('Local puppeteer executable path is undefined');
      }
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-plugins',
        ],
        executablePath,
      });
    }

    cachedBrowser = browser;
    return browser;
  } catch (err) {
    console.error('[getBrowser] Failed to launch browser:', err);
    throw err;
  } finally {
    browserPromise = null;
  }
}

// Internal core rendering function
export async function renderSocialImage(
  browser: any,
  props: SocialCardProps
): Promise<Buffer> {
  if (!browser.isConnected()) {
    throw new Error('Browser is not connected.')
  }

  await loadServerModules()

  const page = await browser.newPage()

  try {
    // Optimize: Disable unnecessary features for faster rendering
    await page.setRequestInterception(true)
    
    page.on('request', (request: any) => {
      const resourceType = request.resourceType();
      
      // Allow documents, images, stylesheets, and fonts
      if (['document', 'image', 'stylesheet', 'font'].includes(resourceType)) {
        request.continue().catch(() => {});
      } else {
        // Block other requests like scripts for performance
        request.abort().catch(() => {});
      }
    });

    await page.setViewport({ width: 1200, height: 630 })
    
    const element = React.createElement(SocialCard, props)
    const html = ReactDOMServer.renderToStaticMarkup(element)
    
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <base href="${props.baseUrl || `https://${siteConfig.domain}`}/">
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' })

    const imageBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      clip: { x: 0, y: 0, width: 1200, height: 630 }
    })

    return imageBuffer
  } finally {
    await page.close()
  }
}


// Exported function for file system generation (ISR/build-time)
export async function generateSocialImage(
  props: any,
  imagePath: string,
  publicUrl: string
): Promise<string> {
  await loadServerModules();
  
  const socialImagesDir = path.dirname(imagePath);

  try {
    // Use fs.mkdir to create parent directories
    await fs.mkdir(socialImagesDir, { recursive: true });
    // Check if file exists
    await fs.access(imagePath);
    return publicUrl;
  } catch {
    // File doesn't exist, so we'll generate it.
  }

  try {
    const browser = await getBrowser();
    // Base URL for resolving assets inside Puppeteer
    const baseUrl = process.env.VERCEL ? `https://${siteConfig.domain}` : 'http://localhost:3000';

    const imageBuffer = await renderSocialImage(browser, {
      ...props,
      baseUrl
    });
    
    await fs.writeFile(imagePath, imageBuffer);
    return publicUrl;
  } catch (err) {
    console.error(`[SocialImage] Failed to generate image for URL '${props.url}':`, err);
    throw err;
  }
}

// Social Image Manager for ISR updates
export class SocialImageManager {
  private previousSiteMap: SiteMap | null = null;
  private previousTagGraph: any = null;

  constructor() {
    void this.loadPreviousState();
  }

  private async loadPreviousState() {
    await loadServerModules();
    
    try {
      const statePath = path.join(process.cwd(), '.next', 'social-images-state.json');
  
      
      try {
        await fs.access(statePath);
  
      } catch {
  
        this.previousSiteMap = null;
        this.previousTagGraph = null;
        return;
      }
      
      const stateData = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(stateData);
      this.previousSiteMap = state.siteMap;
      this.previousTagGraph = state.tagGraph;
    } catch (err) {
      console.error('[SocialImageManager] Failed to load previous state:', err);
      this.previousSiteMap = null;
      this.previousTagGraph = null;
    }
  }

  private async saveState(siteMap: SiteMap, tagGraph: any) {
    await loadServerModules();
    
    try {
      const statePath = path.join(process.cwd(), '.next', 'social-images-state.json');
  
      const stateDir = path.dirname(statePath);
      await fs.mkdir(stateDir, { recursive: true });
      
      const stateData = {
        siteMap,
        tagGraph,
        lastUpdated: Date.now()
      };
      
      await fs.writeFile(statePath, JSON.stringify(stateData, null, 2));
    } catch (err) {
      console.error('[SocialImageManager] Failed to save state:', err);
    }
  }

  private generateImageKey(pageInfo: PageInfo): string {
    return `${pageInfo.type}-${pageInfo.language}-${pageInfo.slug || pageInfo.pageId || ''}`;
  }

  private hasPageChanged(oldPage: PageInfo | undefined, newPage: PageInfo): boolean {
    if (!oldPage) {
      return true;
    }
    
    const relevantFields = [
      'title', 'type', 'language', 'public', 'date', 
      'tags', 'authors', 'breadcrumb', 'coverImage'
    ];
    
    const hasChanged = relevantFields.some(field => {
      const oldValue = (oldPage as any)[field];
      const newValue = (newPage as any)[field];
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    });
    
    return hasChanged;
  }

  private async deleteImage(imagePath: string) {
    await loadServerModules();
    
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`[SocialImageManager] Failed to delete image: ${imagePath}`, err);
      }
    }
  }

  private async cleanupOrphanedFiles(siteMap: SiteMap, tagGraph: any): Promise<void> {
    const { localeList } = localeConfig;
    const baseDir = path.join(process.cwd(), 'public', 'social-images');
    
    for (const locale of localeList) {
      await this.cleanupOrphanedFilesForLocale(siteMap, tagGraph, locale, baseDir);
    }
  }

  private async cleanupOrphanedFilesForLocale(siteMap: SiteMap, tagGraph: any, locale: string, baseDir: string): Promise<void> {
    const localeDir = path.join(baseDir, locale);
    
    try {
      // Get current valid pages and tags for this locale
      const validPages = this.getValidPagesForLocale(siteMap, locale);
      const validTags = this.getValidTagsForLocale(tagGraph, locale);
      
      // Cleanup post/category files
      await this.cleanupDirectory(path.join(localeDir, 'post'), validPages.posts);
      await this.cleanupDirectory(path.join(localeDir, 'category'), validPages.categories);
      
      // Cleanup tag files
      await this.cleanupDirectory(path.join(localeDir, 'tag'), validTags);
      
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`[SocialImageManager] Error during cleanup for locale ${locale}:`, err);
      }
    }
  }

  private getValidPagesForLocale(siteMap: SiteMap, locale: string): { posts: Set<string>, categories: Set<string> } {
    const posts = new Set<string>();
    const categories = new Set<string>();
    
    for (const [_pageId, page] of Object.entries(siteMap.pageInfoMap || {})) {
      if (page.language === locale && page.slug) {
        const filename = `${page.slug}.jpg`;
        if (page.type === 'Post' || page.type === 'Home') {
          posts.add(filename);
        } else if (page.type === 'Category') {
          categories.add(filename);
        }
      }
    }
    
    return { posts, categories };
  }

  private getValidTagsForLocale(tagGraph: any, locale: string): Set<string> {
    const validTags = new Set<string>();
    const localeTags = tagGraph?.locales?.[locale]?.tagCounts || {};
    
    for (const tag of Object.keys(localeTags)) {
      validTags.add(`${encodeURIComponent(tag)}.jpg`);
    }
    
    return validTags;
  }

  private async cleanupDirectory(dirPath: string, validFiles: Set<string>): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        if (file.endsWith('.jpg') && !validFiles.has(file)) {
          const filePath = path.join(dirPath, file);
          await this.deleteImage(filePath);
        }
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`[SocialImageManager] Error reading directory ${dirPath}:`, err);
      }
    }
  }

  private async deleteTagImages(removedTags: string[], locale: string) {
    const socialImagesDir = path.join(process.cwd(), 'public', 'social-images', locale, 'tag');
    
    for (const tag of removedTags) {
      const encodedTag = encodeURIComponent(tag);
      const imagePath = path.join(socialImagesDir, `${encodedTag}.jpg`);
      await this.deleteImage(imagePath).catch(err => {
        console.error(`[SocialImageManager] Failed to delete image: ${imagePath}`, err);
      });
    }
  }

  private async deletePageImages(removedPages: PageInfo[]) {
    for (const page of removedPages) {
      const slugStr = page.slug;
      if (!slugStr) continue;
      
      const baseDir = path.join(process.cwd(), 'public', 'social-images', String(page.language));
      const filename = String(slugStr) + '.jpg';
      let imagePath: string;
      
      switch (page.type) {
        case 'Post':
        case 'Home':
          imagePath = path.join(baseDir, 'post', String(filename));
          break;
        case 'Category':
          imagePath = path.join(baseDir, 'category', String(filename));
          break;
        default:
          continue;
      }
      
      await this.deleteImage(imagePath).catch(err => {
        console.error(`[SocialImageManager] Failed to delete image: ${imagePath}`, err);
      });
    }
  }

  async syncSocialImages(siteMap: SiteMap, tagGraph: any) {
    console.log('🔄 Starting social images sync...');
    console.log(`📊 SiteMap: ${Object.keys(siteMap.pageInfoMap || {}).length} pages`);
    console.log(`📊 TagGraph: ${Object.keys(tagGraph?.locales || {}).length} locales`);
    
    const syncStartTime = Date.now();
    
    // Force regeneration for testing - check if we're in development
    const forceRegenerate = process.env.NODE_ENV === 'development';
    
    if (!this.previousSiteMap && !forceRegenerate) {
      console.log('📋 First run detected, skipping processing (build-time handles this)');
      await this.saveState(siteMap, tagGraph);
      return;
    }

    const { localeList } = localeConfig;
    const tasks: Array<{
      url: string;
      imagePath: string;
      publicUrl: string;
      props: SocialCardProps;
    }> = [];

    const pagesToUpdate: PageInfo[] = [];
    const pagesToDelete: PageInfo[] = [];
    const tagsToAdd: string[] = [];
    const tagsToDelete: Record<string, string[]> = {};

    // Initialize tagsToDelete for each locale
    for (const locale of localeList) {
      tagsToDelete[locale] = [];
    }

    // Compare pages
    const oldPages = this.previousSiteMap?.pageInfoMap || {};
    const newPages = siteMap.pageInfoMap || {};

    console.log(`📊 Comparing ${Object.keys(oldPages).length} old vs ${Object.keys(newPages).length} new pages`);

    for (const [pageId, newPage] of Object.entries(newPages)) {
      const oldPage = oldPages[pageId];
      
      if (forceRegenerate || !oldPage || this.hasPageChanged(oldPage, newPage)) {
        if (newPage.slug && (newPage.type === 'Post' || newPage.type === 'Home' || newPage.type === 'Category')) {
          pagesToUpdate.push(newPage);
          if (oldPage) {
            console.log(`   🔄 Page changed: ${newPage.slug} (${newPage.language})`);
          } else {
            console.log(`   ➕ New page: ${newPage.slug} (${newPage.language})`);
          }
        }
      }
    }
    
    console.log(`📊 Page comparison: ${pagesToUpdate.length} to update, ${Object.keys(newPages).length - pagesToUpdate.length} unchanged`);

    // Find removed pages
    for (const [pageId, oldPage] of Object.entries(oldPages)) {
      if (!newPages[pageId]) {
        pagesToDelete.push(oldPage);
        console.log(`   🗑️  Removed page: ${oldPage.slug} (${oldPage.language})`);
      }
    }

    // Compare tags
    console.log(`🏷️  Comparing tags across ${localeList.length} locales...`);
    for (const locale of localeList) {
      const oldTags = this.previousTagGraph?.locales?.[locale]?.tagCounts || {};
      const newTags = tagGraph?.locales?.[locale]?.tagCounts || {};

      console.log(`   📊 ${locale}: ${Object.keys(oldTags).length} old vs ${Object.keys(newTags).length} new tags`);

      // Find new tags
      for (const tag of Object.keys(newTags)) {
        if (forceRegenerate || !oldTags[tag]) {
          tagsToAdd.push(tag);
          console.log(`      ➕ New tag: ${tag} (${locale})`);
        }
      }

      // Find removed tags
      for (const tag of Object.keys(oldTags)) {
        if (!newTags[tag]) {
          tagsToDelete[locale].push(tag);
          console.log(`      🗑️  Removed tag: ${tag} (${locale})`);
        }
      }
    }
    
    console.log(`🏷️  Tag comparison: ${tagsToAdd.length} added, ${Object.values(tagsToDelete).flat().length} removed`);

    // Delete existing images for pages being updated
    console.log(`🗑️  Deleting ${pagesToUpdate.length} outdated page images...`);
    let deletedPagesCount = 0;
    for (const page of pagesToUpdate) {
      const slugStr = page.slug;
      const langStr = page.language;
      if (!slugStr || !langStr) {
        continue;
      }

      const baseDir = path.join(process.cwd(), 'public', 'social-images', String(langStr));
      const filename = String(slugStr) + '.jpg';
      let imagePath: string;
      
      switch (page.type) {
        case 'Post':
        case 'Home':
          imagePath = path.join(baseDir, 'post', String(filename));
          break;
        case 'Category':
          imagePath = path.join(baseDir, 'category', String(filename));
          break;
        default:
          continue;
      }
      
      await this.deleteImage(imagePath).catch(err => {
        console.error(`[SocialImageManager] Failed to delete image: ${imagePath}`, err);
      });
      deletedPagesCount++;
    }
    console.log(`   ✅ Deleted ${deletedPagesCount} outdated page images`);

    // Generate tasks for updated/new pages
    for (const page of pagesToUpdate) {
      const slugStr = page.slug;
      const langStr = page.language;
      if (!slugStr || !langStr) {
        continue;
      }

      const baseUrl = '/' + String(langStr);
      const socialImagesDir = path.join(process.cwd(), 'public', 'social-images', String(langStr));

      let url: string;
      let imagePath: string;
      let publicUrl: string;

      if (page.type === 'Post' || page.type === 'Home') {
        const filename = String(slugStr) + '.jpg';
        url = baseUrl + '/post/' + String(slugStr);
        imagePath = path.join(socialImagesDir, 'post', String(filename));
        publicUrl = '/social-images/' + String(langStr) + '/post/' + String(filename);
      } else if (page.type === 'Category') {
        const filename = String(slugStr) + '.jpg';
        url = baseUrl + '/category/' + String(slugStr);
        imagePath = path.join(socialImagesDir, 'category', String(filename));
        publicUrl = '/social-images/' + String(langStr) + '/category/' + String(filename);
      } else {
        continue;
      }

      tasks.push({
            url,
            imagePath,
            publicUrl,
            props: {
              url,
              siteMap,
              baseUrl: `https://${siteConfig.domain}`
            }
          });
    }

    // Delete existing images for tags being updated
    console.log(`🏷️  Deleting ${tagsToAdd.length} outdated tag images...`);
    let deletedTagsCount = 0;
    for (const locale of localeList) {
      const localeTags = tagGraph?.locales?.[locale]?.tagCounts || {};
      
      for (const tag of tagsToAdd) {
        if (localeTags[tag]) {
          const encodedTag = encodeURIComponent(tag);
          const imagePath = path.join(process.cwd(), 'public', 'social-images', locale, 'tag', `${encodedTag}.jpg`);
          
          await this.deleteImage(imagePath).catch(err => {
            console.error(`[SocialImageManager] Failed to delete tag image: ${imagePath}`, err);
          });
          deletedTagsCount++;
        }
      }
    }
    console.log(`   ✅ Deleted ${deletedTagsCount} outdated tag images`);

    // Generate tasks for new tags
    for (const locale of localeList) {
      const localeTags = tagGraph?.locales?.[locale]?.tagCounts || {};
      
      for (const tag of tagsToAdd) {
        if (localeTags[tag]) {
          const encodedTag = encodeURIComponent(tag);
          const url = `/${locale}/tag/${encodedTag}`;
          const imagePath = path.join(process.cwd(), 'public', 'social-images', locale, 'tag', `${encodedTag}.jpg`);
          const publicUrl = `/social-images/${locale}/tag/${encodedTag}.jpg`;

          tasks.push({
            url,
            imagePath,
            publicUrl,
            props: {
              url,
              siteMap,
              baseUrl: `https://${siteConfig.domain}`
            }
          });
        }
      }
    }

    // Delete removed images
    await this.deletePageImages(pagesToDelete).catch(err => {
      console.error('[SocialImageManager] Failed to delete page images:', err);
    });
    for (const locale of localeList) {
      await this.deleteTagImages(tagsToDelete[locale], locale).catch(err => {
        console.error(`[SocialImageManager] Failed to delete tag images for locale ${locale}:`, err);
      });
    }

    // Generate new/updated images
    console.log(`🎨 Generating ${tasks.length} new/updated images...`);
    if (tasks.length > 0) {
      const { generateSocialImagesOptimized } = await import('./og-images-batch');
      await generateSocialImagesOptimized(tasks, {
        batchSize: 8,
        baseUrl: process.env.VERCEL ? `https://${siteConfig.domain}` : 'http://localhost:3000'
      });
      console.log(`   ✅ Generated ${tasks.length} images successfully`);
    } else {
      console.log('✅ No new images to generate');
    }

    // Update state
    await this.saveState(siteMap, tagGraph);
    console.log(`💾 State saved for next sync`);
    
    const totalTime = Date.now() - syncStartTime;
    console.log(`🎉 Sync completed in ${Math.round(totalTime/1000)}s!`);
    console.log(`   📊 Summary: ${tasks.length} generated, ${pagesToDelete.length + Object.values(tagsToDelete).flat().length} deleted`);
  }
}

// Global instance
export const socialImageManager = new SocialImageManager();

// Social image sync functions (integrated from social-image-sync.ts)

let isSyncing = false;

export async function syncSocialImagesWithSiteMap(siteMap: SiteMap) {
  if (isSyncing) {
    return;
  }

  isSyncing = true;
  
  try {
    const tagGraphData = buildTagGraphData(siteMap);
    await socialImageManager.syncSocialImages(siteMap, tagGraphData);
  } catch (err) {
    console.error('[SocialImageSync] Error during social image sync:', err);
  } finally {
    isSyncing = false;
  }
}

// Hook to integrate with site-cache ISR updates
export function setupSocialImageSync() {
  // This will be called from site-cache.ts after site map updates
}