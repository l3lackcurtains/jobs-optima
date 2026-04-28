import { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import { Logger } from '@nestjs/common';

// Import stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin to playwright
chromium.use(StealthPlugin());

/**
 * Optional outbound proxy / bot-resolver for the job scanner.
 *
 * Many job sites block datacenter IPs. To mitigate this without making the
 * scanner dependent on a paid service, we read an HTTP/HTTPS proxy from env
 * vars. If unset, Playwright runs without a proxy (works fine for self-host
 * on residential IPs).
 *
 * Compatible with anything that exposes a standard HTTP proxy endpoint:
 * BrightData, Oxylabs, Smartproxy, ScraperAPI (proxy mode), Webshare, etc.
 *
 * Env:
 *   SCRAPING_PROXY_SERVER   e.g. http://brd.superproxy.io:22225
 *   SCRAPING_PROXY_USERNAME (optional)
 *   SCRAPING_PROXY_PASSWORD (optional)
 *   SCRAPING_PROXY_BYPASS   comma-separated host list, e.g. localhost,127.0.0.1
 */
function getProxyConfig(): {
  server: string;
  username?: string;
  password?: string;
  bypass?: string;
} | undefined {
  const server = process.env.SCRAPING_PROXY_SERVER?.trim();
  if (!server) return undefined;

  return {
    server,
    username: process.env.SCRAPING_PROXY_USERNAME?.trim() || undefined,
    password: process.env.SCRAPING_PROXY_PASSWORD?.trim() || undefined,
    bypass: process.env.SCRAPING_PROXY_BYPASS?.trim() || undefined,
  };
}

interface BrowserInstance {
  browser: Browser;
  inUse: boolean;
  lastUsed: Date;
  id: string;
}

export class BrowserPool {
  private readonly logger = new Logger(BrowserPool.name);
  private pool: BrowserInstance[] = [];
  private readonly maxPoolSize = 3;
  private readonly maxIdleTime = 60000; // 1 minute
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleBrowsers();
    }, 30000); // Check every 30 seconds
  }

  private async cleanupIdleBrowsers() {
    const now = Date.now();
    const browsersToRemove: BrowserInstance[] = [];

    for (const instance of this.pool) {
      if (!instance.inUse && 
          now - instance.lastUsed.getTime() > this.maxIdleTime) {
        browsersToRemove.push(instance);
      }
    }

    for (const instance of browsersToRemove) {
      try {
        await instance.browser.close();
        this.pool = this.pool.filter(i => i.id !== instance.id);
        this.logger.debug(`Cleaned up idle browser ${instance.id}`);
      } catch (error: any) {
        this.logger.warn(`Failed to cleanup browser ${instance.id}: ${error.message}`);
      }
    }
  }

  async acquire(): Promise<Browser> {
    // First, try to find an available browser in the pool
    const availableBrowser = this.pool.find(instance => !instance.inUse);
    
    if (availableBrowser) {
      availableBrowser.inUse = true;
      availableBrowser.lastUsed = new Date();
      this.logger.debug(`Reusing browser ${availableBrowser.id} from pool`);
      return availableBrowser.browser;
    }

    // If pool is not full, create a new browser
    if (this.pool.length < this.maxPoolSize) {
      const browser = await this.createBrowser();
      const instance: BrowserInstance = {
        browser,
        inUse: true,
        lastUsed: new Date(),
        id: Math.random().toString(36).substr(2, 9)
      };
      this.pool.push(instance);
      this.logger.debug(`Created new browser ${instance.id}, pool size: ${this.pool.length}`);
      return browser;
    }

    // Pool is full, wait for a browser to become available
    this.logger.debug('Browser pool is full, waiting for availability...');
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.pool.find(instance => !instance.inUse);
        if (available) {
          clearInterval(checkInterval);
          available.inUse = true;
          available.lastUsed = new Date();
          this.logger.debug(`Acquired browser ${available.id} after waiting`);
          resolve(available.browser);
        }
      }, 1000);
    });
  }

  async release(browser: Browser) {
    const instance = this.pool.find(i => i.browser === browser);
    if (instance) {
      instance.inUse = false;
      instance.lastUsed = new Date();
      this.logger.debug(`Released browser ${instance.id} back to pool`);
      
      // Clean up any open pages to free resources
      try {
        const contexts = browser.contexts();
        for (const context of contexts) {
          await context.close();
        }
      } catch (error: any) {
        this.logger.warn(`Error cleaning contexts: ${error.message}`);
      }
    }
  }

  private async createBrowser(): Promise<Browser> {
    const proxy = getProxyConfig();
    if (proxy) {
      this.logger.log(
        `Launching browser through proxy ${proxy.server}${proxy.username ? ` (auth: ${proxy.username})` : ''}`,
      );
    }

    // Launch with stealth mode and additional anti-detection measures
    return chromium.launch({
      headless: true, // Can also try 'new' for newer headless mode
      proxy, // Playwright accepts undefined here — direct connection when unset
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-gpu',
        '--no-first-run',
        '--disable-accelerated-2d-canvas',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
        '--disable-features=OutOfBlinkCors',
        '--start-maximized',
        // Additional anti-detection flags
        '--disable-infobars',
        '--disable-extensions',
        '--disable-plugins-discovery',
        '--disable-blink-features',
        '--disable-software-rasterizer',
      ],
    }) as any as Browser;
  }

  async shutdown() {
    this.logger.log('Shutting down browser pool...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const closePromises = this.pool.map(async (instance) => {
      try {
        await instance.browser.close();
        this.logger.debug(`Closed browser ${instance.id}`);
      } catch (error: any) {
        this.logger.warn(`Failed to close browser ${instance.id}: ${error.message}`);
      }
    });

    await Promise.all(closePromises);
    this.pool = [];
    this.logger.log('Browser pool shutdown complete');
  }
}

// Singleton instance
export const browserPool = new BrowserPool();