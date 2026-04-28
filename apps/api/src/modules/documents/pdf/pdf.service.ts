import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import * as ejs from 'ejs';
import * as path from 'path';

@Injectable()
export class PdfService {
  async generateResumePdf(resume: any): Promise<Buffer> {
    // Use different paths for development and production
    // In production (Docker), templates are in apps/api/src/...
    // In development, we're running from apps/api directory
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const templatePath = isDevelopment
      ? path.join(
          process.cwd(),
          'src/modules/documents/pdf/templates',
          'resume.ejs',
        )
      : path.join(
          process.cwd(),
          'apps/api/src/modules/documents/pdf/templates',
          'resume.ejs',
        );

    const html = await ejs.renderFile(templatePath, { resume });

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
      });

      await context.close();
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  async generateAtsReport(
    resume: any,
    jobDescription: string,
    keywords: string[],
    matchedKeywords: string[],
    unmatchedKeywords: string[],
  ): Promise<Buffer> {
    // Use different paths for development and production
    // In production (Docker), templates are in apps/api/src/...
    // In development, we're running from apps/api directory
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const templatePath = isDevelopment
      ? path.join(
          process.cwd(),
          'src/modules/documents/pdf/templates',
          'ats-report.ejs',
        )
      : path.join(
          process.cwd(),
          'apps/api/src/modules/documents/pdf/templates',
          'ats-report.ejs',
        );

    const matchPercentage =
      keywords.length > 0
        ? ((matchedKeywords.length / keywords.length) * 100).toFixed(1)
        : 0;

    const html = await ejs.renderFile(templatePath, {
      resume,
      jobDescription,
      keywords,
      matchedKeywords,
      unmatchedKeywords,
      matchPercentage,
    });

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
      });

      await context.close();
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
