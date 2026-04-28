import { Page, BrowserContext } from 'playwright';

/**
 * Advanced anti-detection utilities for minimizing CAPTCHA encounters
 */
export class AntiDetectionUtils {
  
  /**
   * Apply comprehensive anti-detection measures to a browser context
   */
  static async applyEvasionTechniques(context: BrowserContext) {
    // Set realistic viewport with common resolutions
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1680, height: 1050 },
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1280, height: 720 },
    ];
    const viewport = viewports[Math.floor(Math.random() * viewports.length)];
    
    // Set realistic user agent
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    ];
    
    // Set context options
    await context.addInitScript(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Add realistic chrome object
      if (!(window as any).chrome) {
        Object.defineProperty(window, 'chrome', {
          value: {
            runtime: {},
            loadTimes: function() {},
            csi: function() {},
          },
        });
      }
      
      // Override permissions - simplified to avoid TypeScript issues
      try {
        const originalQuery = window.navigator.permissions?.query;
        if (originalQuery) {
          window.navigator.permissions.query = (parameters: any) => {
            return originalQuery.call(window.navigator.permissions, parameters);
          };
        }
      } catch (e) {
        // Permissions API might not be available
      }
      
      // Add realistic plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          return [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', length: 1 },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', length: 1 },
            { name: 'Native Client', filename: 'internal-nacl-plugin', length: 2 },
          ];
        },
      });
      
      // Override WebGL vendor and renderer
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };
      
      // Add realistic screen properties
      Object.defineProperty(screen, 'availWidth', {
        get: () => screen.width - 50,
      });
      Object.defineProperty(screen, 'availHeight', {
        get: () => screen.height - 100,
      });
      
      // Override battery API
      if ('getBattery' in navigator) {
        (navigator as any).getBattery = () => Promise.resolve({
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          level: 0.87,
        });
      }
      
      // Add realistic connection info
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 50,
          downlink: 10.0,
          saveData: false,
        }),
      });
    });
  }
  
  /**
   * Simulate human-like behavior on a page
   */
  static async simulateHumanBehavior(page: Page) {
    try {
      const viewport = page.viewportSize();
      if (!viewport) return;
      
      // Random mouse movements with curves
      const movements = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < movements; i++) {
        const startX = Math.random() * viewport.width;
        const startY = Math.random() * viewport.height;
        const endX = Math.random() * viewport.width;
        const endY = Math.random() * viewport.height;
        
        // Create curved path
        const steps = 10 + Math.floor(Math.random() * 20);
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          // Add some curve to the movement
          const curve = Math.sin(t * Math.PI) * 50;
          const x = startX + (endX - startX) * t + curve;
          const y = startY + (endY - startY) * t;
          
          await page.mouse.move(x, y);
          await this.randomDelay(10, 30);
        }
        
        await this.randomDelay(200, 500);
      }
      
      // Random scrolling with smooth behavior
      const scrolls = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < scrolls; i++) {
        const scrollAmount = 100 + Math.floor(Math.random() * 300);
        await page.evaluate((amount) => {
          window.scrollBy({
            top: amount,
            behavior: 'smooth',
          });
        }, scrollAmount);
        await this.randomDelay(500, 1000);
      }
      
      // Sometimes scroll back up
      if (Math.random() > 0.5) {
        const scrollBack = -50 - Math.floor(Math.random() * 150);
        await page.evaluate((amount) => {
          window.scrollBy({
            top: amount,
            behavior: 'smooth',
          });
        }, scrollBack);
        await this.randomDelay(300, 600);
      }
      
      // Random hover on elements
      if (Math.random() > 0.6) {
        const links = await page.$$('a');
        if (links.length > 0) {
          const randomLink = links[Math.floor(Math.random() * Math.min(links.length, 5))];
          await randomLink.hover();
          await this.randomDelay(100, 300);
        }
      }
    } catch (error) {
      // Silently fail - this is non-critical
    }
  }
  
  /**
   * Add realistic cookies to appear as a returning user
   */
  static async addRealisticCookies(context: BrowserContext, domain: string) {
    const cookies = [
      {
        name: '_ga',
        value: `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
        domain: `.${domain}`,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 63072000, // 2 years
      },
      {
        name: '_gid',
        value: `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
        domain: `.${domain}`,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 86400, // 1 day
      },
    ];
    
    try {
      await context.addCookies(cookies);
    } catch (error) {
      // Silently fail if cookies can't be added
    }
  }
  
  /**
   * Wait with random delay to appear more human
   */
  static randomDelay(min: number = 100, max: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
  
  
  
  /**
   * Rate limiting helper to avoid triggering anti-bot measures
   */
  static async respectRateLimit(lastRequestTime: Date | null, minDelayMs: number = 2000): Promise<void> {
    if (lastRequestTime) {
      const elapsed = Date.now() - lastRequestTime.getTime();
      if (elapsed < minDelayMs) {
        await this.randomDelay(minDelayMs - elapsed, minDelayMs - elapsed + 1000);
      }
    }
  }
}