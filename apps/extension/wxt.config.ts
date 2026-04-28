import { defineConfig } from 'wxt';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readFileSync } from 'fs';

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  publicDir: 'public',
  manifest: {
    name: 'Jobs Optima',
    description: 'AI-powered job search and resume optimization assistant',
    version: version,
    permissions: [
      'storage',
      'tabs',
      'sidePanel',
      'scripting'
    ],
    host_permissions: [
      'http://localhost:8888/*',
      'http://localhost:4000/*',
      '<all_urls>'
    ],
    action: {
      default_title: 'Open Jobs Optima',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png'
      }
    },
    side_panel: {
      default_path: 'sidepanel.html'
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png'
    }
  },
  hooks: {
    'build:done': (wxt) => {
      // Copy icon files to output directory
      const iconSizes = ['16', '32', '48', '128'];
      const outputDir = resolve(wxt.config.outDir, 'icon');
      
      try {
        mkdirSync(outputDir, { recursive: true });
        
        iconSizes.forEach(size => {
          const src = resolve('public', 'icon', `${size}.png`);
          const dest = resolve(outputDir, `${size}.png`);
          copyFileSync(src, dest);
          console.log(`Copied icon: ${size}.png`);
        });
      } catch (error) {
        console.error('Error copying icons:', error);
      }
    }
  }
});