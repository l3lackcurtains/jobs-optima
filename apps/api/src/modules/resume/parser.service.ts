import { Injectable, BadRequestException } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { AiService } from '@modules/ai/ai.service';
import { z } from 'zod';
import { generateObject } from 'ai';
import {
  RESUME_PARSER_PROMPT,
  RESUME_PARSER_SYSTEM_PROMPT,
} from '@modules/ai/prompts/resume-parser.prompt';
import { AI_CONFIG } from '@modules/ai/ai.constants';

const ExtractedResumeSchema = z.object({
  contactInfo: z.object({
    name: z.string(),
    location: z.string(),
    email: z.string(), // Remove .email() as Gemini doesn't support format validation
    phone: z.string(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    personalWebsite: z.string().optional(),
  }),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      dates: z.string(),
      responsibilities: z.array(z.string()),
    }),
  ),
  projects: z
    .array(
      z.object({
        name: z.string(),
        technologies: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
  education: z.array(
    z.object({
      institution: z.string(),
      location: z.string(),
      dates: z.string(),
      degree: z.string(),
      achievements: z.array(z.string()).optional(),
    }),
  ),
  skills: z.object({
    technicalSkills: z.array(z.string()),
    developmentPracticesMethodologies: z.array(z.string()),
    personalSkills: z.array(z.string()),
  }),
});

@Injectable()
export class ParserService {
  constructor(private aiService: AiService) {}


  async parseResume(fileBuffer: Buffer, mimeType: string, userId: string): Promise<any> {
    let textContent: string;

    try {
      if (mimeType === 'application/pdf') {
        textContent = await this.parsePdf(fileBuffer);
      } else if (
        mimeType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        textContent = await this.parseDocx(fileBuffer);
      } else if (mimeType === 'text/plain') {
        textContent = fileBuffer.toString('utf-8');
      } else {
        throw new BadRequestException(
          'Unsupported file format. Please upload PDF, DOCX, or TXT files.',
        );
      }

      const extractedData = await this.extractResumeData(textContent, userId);
      return extractedData;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to parse resume file: ${errorMessage}`,
      );
    }
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      // Parse PDF to extract text
      const data = await pdfParse(buffer);

      if (!data || !data.text) {
        throw new Error('No text extracted from PDF');
      }

      return data.text.trim();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse PDF file: ${errorMessage}`);
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      throw new Error('Failed to parse DOCX file');
    }
  }

  private async extractResumeData(text: string, userId: string): Promise<any> {
    const prompt = RESUME_PARSER_PROMPT.replace('${resumeText}', text);

    const runExtraction = async (model: any) => {
      const result = await generateObject({
        model,
        schema: ExtractedResumeSchema,
        messages: [
          { role: 'system', content: RESUME_PARSER_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.RESUME_PARSING,
      });
      return result.object;
    };

    // Try user's own model / pro credits first
    try {
      const model = await this.aiService.resolveModel(userId);
      return await runExtraction(model);
    } catch (_userModelError) {
      // Fall through to system key
    }

    // Fall back to platform system key (AI_API_KEY env var)
    try {
      const model = this.aiService.getSystemModel();
      return await runExtraction(model);
    } catch (error) {
      throw new BadRequestException(
        'Resume parsing requires an AI key. Add your own API key in Settings → AI Provider, or ask your administrator to configure AI_API_KEY on the server.',
      );
    }
  }

  private basicExtraction(text: string): any {
    const lines = text.split('\n').filter((line) => line.trim());

    // Basic extraction logic
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex =
      /[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}/;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const email = text.match(emailRegex)?.[0] || '';
    const phone = text.match(phoneRegex)?.[0] || '';
    const urls: string[] = text.match(urlRegex) || [];

    const linkedin =
      urls.find((url: string) => url.includes('linkedin.com')) || '';
    const github = urls.find((url: string) => url.includes('github.com')) || '';

    return {
      contactInfo: {
        name: lines[0] || 'Name Not Found',
        location: 'Location Not Found',
        email,
        phone,
        linkedin,
        github,
        personalWebsite:
          urls.find(
            (url: string) =>
              !url.includes('linkedin.com') && !url.includes('github.com'),
          ) || '',
      },
      experience: [],
      projects: [],
      education: [],
      skills: {
        technicalSkills: [],
        developmentPracticesMethodologies: [],
        personalSkills: [],
      },
    };
  }
}
