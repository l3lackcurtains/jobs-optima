import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createXai } from '@ai-sdk/xai';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject, type LanguageModel } from 'ai';
import {
  KeywordsExtractorService,
  Keywords,
} from '@modules/job/keywords-extractor.service';
import * as prompts from './prompts';
import type {
  ResumeData,
  OptimizationResult,
} from './types/optimization.types';
import {
  JobParserSchema,
  type JobParserResult,
} from './types/job-parser.types';
import {
  AIProvider,
  DEFAULT_MODELS,
  AI_CONFIG,
  PLATFORM_MODEL,
  PRO_DAILY_CALL_CAP,
  FREE_DAILY_CALL_CAP,
  ALLOWED_MODELS,
  isValidModel,
  isValidProvider,
} from './ai.constants';
import {
  OptimizationResultSchema,
  SkillSuggestionsSchema,
  ContentSuggestionsSchema,
  BaseSkillSuggestionsSchema,
  CoverLetterSchema,
  QnASchema,
} from './ai.schema';
import { User, UserDocument } from '@schemas/user.schema';

@Injectable()
export class AiService {
  constructor(
    private keywordsExtractor: KeywordsExtractorService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Returns the platform Gemini Flash model. For background/system tasks
   * (e.g. job-scanner relevance scoring) that aren't billed against user
   * credits.
   *
   * Falls back to AI_API_KEY when PLATFORM_GEMINI_API_KEY is unset, but only
   * if AI_PROVIDER is gemini (or unset, since gemini is the default) — other
   * providers can't power a Gemini call. Throws if neither key is available.
   */
  getPlatformModel(): LanguageModel {
    const platformKey = process.env.PLATFORM_GEMINI_API_KEY;
    if (platformKey) {
      return createGoogleGenerativeAI({ apiKey: platformKey })(PLATFORM_MODEL);
    }

    const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();
    const fallbackKey = process.env.AI_API_KEY;
    if (provider === 'gemini' && fallbackKey) {
      return createGoogleGenerativeAI({ apiKey: fallbackKey })(PLATFORM_MODEL);
    }

    throw new BadRequestException(
      'Platform AI is not configured. Set PLATFORM_GEMINI_API_KEY (or AI_API_KEY with AI_PROVIDER=gemini).',
    );
  }

  /**
   * Returns a model using the platform-level AI_API_KEY + AI_PROVIDER env vars.
   * Used for system tasks (resume parsing) that should work even for users without
   * a personal API key. Throws if no platform key is configured.
   */
  getSystemModel(): LanguageModel {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'No AI key available. Configure AI_API_KEY on the server or add your own key in Settings.',
      );
    }
    return this.getModel({
      provider: process.env.AI_PROVIDER,
      apiKey,
      model: process.env.AI_MODEL,
    });
  }

  getModel(override: { provider?: string; apiKey: string; model?: string }): LanguageModel {
    const rawProvider = override.provider || AIProvider.GEMINI;
    if (!isValidProvider(rawProvider)) {
      throw new BadRequestException({
        code: 'INVALID_AI_PROVIDER',
        message: `Unsupported AI provider "${rawProvider}". Choose one of: ${Object.values(AIProvider).join(', ')}.`,
      });
    }
    const provider = rawProvider;
    const apiKey = override.apiKey;
    const model = override.model || DEFAULT_MODELS[provider];

    if (!isValidModel(provider, model)) {
      throw new BadRequestException({
        code: 'INVALID_AI_MODEL',
        message: `Model "${model}" is not supported for ${provider}. Pick one from the Settings page model list.`,
        allowedModels: ALLOWED_MODELS[provider],
      });
    }

    switch (provider) {
      case AIProvider.OPENAI:
        return createOpenAI({ apiKey })(model);
      case AIProvider.ANTHROPIC:
        return createAnthropic({ apiKey })(model);
      case AIProvider.DEEPSEEK:
        return createDeepSeek({ apiKey })(model) as LanguageModel;
      case AIProvider.XAI:
        return createXai({ apiKey })(model) as LanguageModel;
      case AIProvider.MISTRAL:
        return createMistral({ apiKey })(model) as LanguageModel;
      case AIProvider.GROQ:
        return createGroq({ apiKey })(model) as LanguageModel;
      case AIProvider.OPENROUTER:
        return createOpenRouter({ apiKey })(model) as unknown as LanguageModel;
      case AIProvider.GEMINI:
      default:
        return createGoogleGenerativeAI({ apiKey })(model);
    }
  }

  /**
   * Atomic credit + daily-cap accounting.
   * Returns true if a credit was consumed. Resets daily counter when 24h have passed.
   */
  private async consumePlatformCredit(userId: string): Promise<boolean> {
    const now = new Date();
    const dailyResetCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Atomic: only succeed if user is pro, has credits, and is under the daily cap
    // (or the daily window has expired and we'll reset).
    const updated = await this.userModel.findOneAndUpdate(
      {
        _id: userId,
        plan: 'pro',
        creditsRemaining: { $gt: 0 },
        $or: [
          { dailyCallsCount: { $lt: PRO_DAILY_CALL_CAP } },
          { dailyCallsResetAt: { $lt: dailyResetCutoff } },
          { dailyCallsResetAt: null },
        ],
      },
      [
        {
          $set: {
            creditsRemaining: { $subtract: ['$creditsRemaining', 1] },
            dailyCallsCount: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$dailyCallsResetAt', null] },
                    { $lt: ['$dailyCallsResetAt', dailyResetCutoff] },
                  ],
                },
                then: 1,
                else: { $add: ['$dailyCallsCount', 1] },
              },
            },
            dailyCallsResetAt: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$dailyCallsResetAt', null] },
                    { $lt: ['$dailyCallsResetAt', dailyResetCutoff] },
                  ],
                },
                then: now,
                else: '$dailyCallsResetAt',
              },
            },
          },
        },
      ],
      { new: true },
    );

    return !!updated;
  }

  /**
   * Track BYO-key calls against the free-tier daily cap (abuse protection
   * even when the user pays the LLM cost themselves).
   */
  private async incrementByoCounter(userId: string): Promise<boolean> {
    const now = new Date();
    const dailyResetCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const updated = await this.userModel.findOneAndUpdate(
      {
        _id: userId,
        $or: [
          { dailyCallsCount: { $lt: FREE_DAILY_CALL_CAP } },
          { dailyCallsResetAt: { $lt: dailyResetCutoff } },
          { dailyCallsResetAt: null },
        ],
      },
      [
        {
          $set: {
            dailyCallsCount: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$dailyCallsResetAt', null] },
                    { $lt: ['$dailyCallsResetAt', dailyResetCutoff] },
                  ],
                },
                then: 1,
                else: { $add: ['$dailyCallsCount', 1] },
              },
            },
            dailyCallsResetAt: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$dailyCallsResetAt', null] },
                    { $lt: ['$dailyCallsResetAt', dailyResetCutoff] },
                  ],
                },
                then: now,
                else: '$dailyCallsResetAt',
              },
            },
          },
        },
      ],
      { new: true },
    );

    return !!updated;
  }

  async resolveModel(userId: string): Promise<LanguageModel> {
    const user = await this.userModel
      .findById(userId)
      .select(
        'aiProvider aiApiKey aiModel plan creditsRemaining creditsResetAt',
      )
      .lean()
      .exec();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Defensive normalization: lean() does not apply schema defaults, so
    // documents predating the billing migration may have undefined fields.
    const credits = user.creditsRemaining ?? 0;
    const plan = user.plan ?? 'free';

    // Pro tier with credits → platform Gemini Flash, decrement atomically
    if (plan === 'pro' && credits > 0) {
      const consumed = await this.consumePlatformCredit(userId);
      if (consumed) {
        const platformKey = process.env.PLATFORM_GEMINI_API_KEY;
        if (!platformKey) {
          throw new BadRequestException(
            'Platform AI is temporarily unavailable. Please try again later or add your own API key in Settings.',
          );
        }
        return createGoogleGenerativeAI({ apiKey: platformKey })(PLATFORM_MODEL);
      }
      // Atomic update failed → either daily cap hit or race depleted credits.
      if (!user.aiApiKey) {
        throw new ForbiddenException({
          code: 'DAILY_LIMIT_REACHED',
          message:
            'Daily limit reached. Try again in 24 hours or add your own API key in Settings.',
        });
      }
      // Fall through to BYO key
    }

    // Pro with no credits left → fall back to BYO if available
    if (plan === 'pro' && credits <= 0 && !user.aiApiKey) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_CREDITS',
        message: `You've used all your monthly credits. Resets ${
          user.creditsResetAt
            ? new Date(user.creditsResetAt).toLocaleDateString()
            : 'on your next billing date'
        }, or add your own API key in Settings.`,
        resetsAt: user.creditsResetAt,
      });
    }

    // BYO key path (free tier, or pro with own key)
    if (!user.aiApiKey) {
      throw new BadRequestException({
        code: 'NO_AI_ACCESS',
        message:
          'No AI access. Add your own API key in Settings or upgrade to Pro for managed AI.',
      });
    }

    const allowed = await this.incrementByoCounter(userId);
    if (!allowed) {
      throw new ForbiddenException({
        code: 'DAILY_LIMIT_REACHED',
        message: 'Daily limit reached. Try again in 24 hours.',
      });
    }

    return this.getModel({
      provider: user.aiProvider ?? undefined,
      apiKey: user.aiApiKey,
      model: user.aiModel ?? undefined,
    });
  }

  /**
   * Extract only the actual resume content fields for keyword matching
   * This ensures we don't match against metadata or stored keyword arrays
   * CRITICAL: This must be used everywhere we do keyword matching
   */
  extractResumeContent(resumeData: ResumeData): string {
    // ONLY include actual content fields that should be searched for keywords
    const contentOnly = {
      contactInfo: {
        name: resumeData.contactInfo?.name || '',
        location: resumeData.contactInfo?.location || '',
        email: resumeData.contactInfo?.email || '',
        phone: resumeData.contactInfo?.phone || '',
        linkedin: resumeData.contactInfo?.linkedin || '',
        github: resumeData.contactInfo?.github || '',
        personalWebsite: resumeData.contactInfo?.personalWebsite || '',
      },
      experience: resumeData.experience || [],
      projects: resumeData.projects || [],
      education: resumeData.education || [],
      skills: resumeData.skills || {
        technicalSkills: [],
        developmentPracticesMethodologies: [],
        personalSkills: [],
      },
    };

    // EXPLICITLY exclude any fields that might contain keywords
    // Do NOT include: _id, userId, keywords, matchedKeywords, unmatchedKeywords,
    // initialATSScore, finalATSScore, isOptimized, parentResumeId, jobId, etc.

    return JSON.stringify(contentOnly);
  }

  private sanitizeSkillsArray(skills: unknown): string[] {
    if (!Array.isArray(skills)) {
      // If it's a string, try to split it
      if (typeof skills === 'string') {
        return skills
          .split(/[,\n]/)
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0);
      }
      return [];
    }

    // If it's already an array, clean up each item
    return skills
      .map((skill) => {
        if (typeof skill === 'string') {
          // Split on line breaks and return the first part, or clean up
          return skill
            .split('\n')
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
        }
        return [];
      })
      .flat()
      .filter((skill) => skill && skill.length > 0);
  }

  private sanitizeOptimizedResume(optimizedResume: ResumeData): ResumeData {
    // Sanitize skills if they exist
    if (optimizedResume.skills) {
      if (optimizedResume.skills.technicalSkills) {
        optimizedResume.skills.technicalSkills = this.sanitizeSkillsArray(
          optimizedResume.skills.technicalSkills,
        );
      }
      if (optimizedResume.skills.developmentPracticesMethodologies) {
        optimizedResume.skills.developmentPracticesMethodologies =
          this.sanitizeSkillsArray(
            optimizedResume.skills.developmentPracticesMethodologies,
          );
      }
      if (optimizedResume.skills.personalSkills) {
        optimizedResume.skills.personalSkills = this.sanitizeSkillsArray(
          optimizedResume.skills.personalSkills,
        );
      }
    }

    return optimizedResume;
  }

  /**
   * Validate AI scores with actual keyword matching
   * Uses the optimized calculateAllScores to avoid redundant calculations
   */
  private validateScoresWithVariations(
    resumeData: ResumeData,
    jobKeywords: Keywords,
  ): {
    atsScore: number;
    keywordScore: number;
    matchedKeywords: string[];
    unmatchedKeywords: string[];
  } {
    // Extract resume content for matching
    const resumeText = this.extractResumeContent(resumeData);

    // Calculate everything at once - no redundant calculations
    const scores = this.keywordsExtractor.calculateAllScores(
      resumeText,
      jobKeywords,
    );

    // Flatten keywords for return
    const matchedKeywords = this.keywordsExtractor.getAllKeywordsFlat(
      scores.matched,
    );
    const unmatchedKeywords = this.keywordsExtractor.getAllKeywordsFlat(
      scores.unmatched,
    );

    return {
      atsScore: scores.atsScore,
      keywordScore: scores.keywordScore,
      matchedKeywords,
      unmatchedKeywords,
    };
  }

  /**
   * Replace placeholders in prompts with actual values
   */
  private fillPromptTemplate(
    template: string,
    replacements: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  async optimizeResume(
    resume: ResumeData,
    jobDescription: string,
    jobKeywords: Keywords,
    userId: string,
  ): Promise<OptimizationResult> {
    // Clean the resume data to ensure we only have the necessary fields
    const cleanContactInfo = {
      name: resume.contactInfo?.name || '',
      location: resume.contactInfo?.location || '',
      email: resume.contactInfo?.email || '',
      phone: resume.contactInfo?.phone || '',
      linkedin: resume.contactInfo?.linkedin || null,
      github: resume.contactInfo?.github || null,
      personalWebsite: resume.contactInfo?.personalWebsite || null,
    };

    const cleanResume = {
      contactInfo: cleanContactInfo,
      experience: resume.experience || [],
      projects: resume.projects || [],
      education: resume.education || [],
      skills: resume.skills || {
        technicalSkills: [],
        developmentPracticesMethodologies: [],
        personalSkills: [],
      },
    };

    const resumeJSON = JSON.stringify(cleanResume, null, 2);

    // Generate prompt with keywords
    const prompt = this.fillPromptTemplate(prompts.RESUME_OPTIMIZATION_PROMPT, {
      jobDescription: jobDescription,
      actionVerbs: jobKeywords.actionVerbs?.join(', ') || 'None',
      hardSkills: jobKeywords.hardSkills?.join(', ') || 'None',
      softSkills: jobKeywords.softSkills?.join(', ') || 'None',
      knowledge: jobKeywords.knowledge?.join(', ') || 'None',
      resumeJSON: resumeJSON,
    });

    try {
      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: OptimizationResultSchema,
        messages: [
          {
            role: 'system',
            content: prompts.RESUME_OPTIMIZATION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: AI_CONFIG.TEMPERATURE.RESUME_OPTIMIZATION,
      });

      const aiResult = result.object;

      // Sanitize the resume part of the result before returning
      if (aiResult.resume) {
        aiResult.resume = this.sanitizeOptimizedResume(aiResult.resume);
      }

      // Build complete result with calculated scores
      const optimizationResult: OptimizationResult = {
        resume: aiResult.resume,
        initialATSScore: 0, // Will be calculated separately by caller
        finalATSScore: 0,
        initialKeywordScore: 0, // Will be calculated separately by caller
        finalKeywordScore: 0,
        keywords: [],
        matchedKeywords: [],
        unmatchedKeywords: [],
      };

      // Calculate scores with actual keyword matching if keywords provided
      if (jobKeywords) {
        const validatedScores = this.validateScoresWithVariations(
          aiResult.resume,
          jobKeywords,
        );
        // Add calculated scores for consistency
        optimizationResult.finalATSScore = validatedScores.atsScore;
        optimizationResult.finalKeywordScore = validatedScores.keywordScore;
        optimizationResult.keywords =
          this.keywordsExtractor.getAllKeywordsFlat(jobKeywords);
        optimizationResult.matchedKeywords = validatedScores.matchedKeywords;
        optimizationResult.unmatchedKeywords =
          validatedScores.unmatchedKeywords;
      }

      return optimizationResult;
    } catch (error) {
      console.error('Error with Gemini:', error);
      throw new Error('Failed to optimize resume with Gemini');
    }
  }

  /**
   * Calculate resume scores (ATS and Keyword) using manual calculation
   * This ensures consistent scoring between initial and final resumes
   */
  calculateResumeScores(
    resumeData: ResumeData,
    jobKeywords: Keywords,
  ): {
    atsScore: number;
    keywordScore: number;
    matchPercentage: number;
  } {
    // Use centralized function to extract only content
    const resumeText = this.extractResumeContent(resumeData);

    // Use the optimized method that calculates everything at once
    const scores = this.keywordsExtractor.calculateAllScores(
      resumeText,
      jobKeywords,
    );

    return {
      atsScore: scores.atsScore,
      keywordScore: scores.keywordScore,
      matchPercentage: scores.matchPercentage,
    };
  }

  async optimizeSkills(
    currentSkills: string[],
    userPrompt: string = '',
    keywords: string[],
    excludeKeywords: string[] = [],
    skillType: 'technical' | 'soft' | 'development',
    userId: string,
  ): Promise<{ suggestions: string[] }> {
    try {
      // Use imported schema for structured output
      const systemPrompt = prompts.SKILLS_OPTIMIZATION_SYSTEM_PROMPT;

      const addKeywordsText =
        keywords.length > 0 ? `[${keywords.join(', ')}]` : 'None';

      const removeKeywordsText =
        excludeKeywords.length > 0 ? `[${excludeKeywords.join(', ')}]` : 'None';

      const userInstructionsText = userPrompt || 'None';

      const prompt = this.fillPromptTemplate(
        prompts.SKILLS_OPTIMIZATION_USER_PROMPT,
        {
          currentSkills: currentSkills.join(', '),
          skillType: skillType,
          addKeywords: addKeywordsText,
          removeKeywords: removeKeywordsText,
          userInstructions: userInstructionsText,
        },
      );

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: SkillSuggestionsSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return {
        suggestions: result.object.suggestions,
      };
    } catch (error) {
      console.error('Skills optimization error:', error);
      throw error;
    }
  }

  async optimizeContent(
    content: string,
    userPrompt: string = '',
    keywords: string[],
    excludeKeywords: string[] = [],
    userId: string,
  ): Promise<{ suggestions: string[] }> {
    try {
      // Use imported schema for structured output
      const systemPrompt = prompts.CONTENT_OPTIMIZATION_SYSTEM_PROMPT;

      const addKeywordsText =
        keywords.length > 0 ? `[${keywords.join(', ')}]` : 'None';

      const removeKeywordsText =
        excludeKeywords.length > 0 ? `[${excludeKeywords.join(', ')}]` : 'None';

      const prompt = this.fillPromptTemplate(
        prompts.CONTENT_OPTIMIZATION_USER_PROMPT,
        {
          content: content,
          addKeywords: addKeywordsText,
          removeKeywords: removeKeywordsText,
          additionalContext: userPrompt || 'None',
        },
      );

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: ContentSuggestionsSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return {
        suggestions: result.object.suggestions,
      };
    } catch (error) {
      console.error('Content optimization error:', error);
      throw error; // Propagate error instead of using poor fallback
    }
  }

  /**
   * Optimize base resume content without specific job keywords
   */
  async optimizeBaseContent(
    content: string,
    userPrompt: string = '',
    userId: string,
  ): Promise<{ suggestions: string[] }> {
    try {
      // Use imported schema for structured output
      const systemPrompt = prompts.BASE_CONTENT_OPTIMIZATION_SYSTEM_PROMPT;

      const prompt = this.fillPromptTemplate(
        prompts.BASE_CONTENT_OPTIMIZATION_USER_PROMPT,
        {
          content: content,
          additionalGuidance: userPrompt || 'None',
        },
      );

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: ContentSuggestionsSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return {
        suggestions: result.object.suggestions,
      };
    } catch (error) {
      console.error('Base content optimization error:', error);
      throw error;
    }
  }

  /**
   * Optimize base resume skills without specific job keywords
   */
  async optimizeBaseSkills(
    currentSkills: string[],
    userPrompt: string = '',
    skillType: 'technical' | 'soft' | 'development',
    userId: string,
  ): Promise<{ suggestions: string[] }> {
    try {
      // Use imported schema for structured output
      const systemPrompt = prompts.BASE_SKILLS_OPTIMIZATION_SYSTEM_PROMPT;

      const skillTypeContext = {
        technical:
          'programming languages, frameworks, tools, and technical competencies',
        soft: 'interpersonal skills, leadership qualities, and professional attributes',
        development:
          'software development practices, methodologies, and approaches',
      };

      const prompt = this.fillPromptTemplate(
        prompts.BASE_SKILLS_OPTIMIZATION_USER_PROMPT,
        {
          skillType: skillType,
          currentSkills: currentSkills.join(', '),
          userContext: userPrompt || 'None',
          skillTypeContext: skillTypeContext[skillType],
        },
      );

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: BaseSkillSuggestionsSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return {
        suggestions: result.object.suggestions,
      };
    } catch (error) {
      console.error('Base skills optimization error:', error);
      throw error;
    }
  }

  /**
   * Generate multiple professional cover letter variations based on resume and job description
   */
  async generateCoverLetter(
    resumeData: ResumeData,
    jobDescription: string,
    customInstructions: string = '',
    userId: string,
  ): Promise<{ suggestions: string[] }> {
    try {
      // Use imported schema for structured output
      const systemPrompt = prompts.COVER_LETTER_GENERATION_SYSTEM_PROMPT;

      // Extract candidate name from resume and capitalize properly
      const rawName = resumeData.contactInfo?.name || '[Your Name]';
      const candidateName = rawName
        .split(' ')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(' ');

      const userPrompt = this.fillPromptTemplate(
        prompts.COVER_LETTER_GENERATION_USER_PROMPT,
        {
          jobDescription: jobDescription,
          resumeData: JSON.stringify(resumeData, null, 2),
          customInstructions: customInstructions || 'None',
          candidateName: candidateName,
        },
      );

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: CoverLetterSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return {
        suggestions: result.object.suggestions,
      };
    } catch (error) {
      console.error('Cover letter generation error:', error);
      throw new Error('Failed to generate cover letter variations');
    }
  }

  /**
   * Optimize an existing cover letter based on job requirements
   */
  async optimizeCoverLetter(
    existingCoverLetter: string,
    resumeData: ResumeData,
    jobDescription: string,
    customInstructions: string = '',
    userId: string,
  ): Promise<{ suggestions: string[] }> {
    try {
      // Use imported schema for structured output
      const systemPrompt = prompts.COVER_LETTER_OPTIMIZATION_SYSTEM_PROMPT;

      // Extract candidate name
      const rawName = resumeData.contactInfo?.name || '[Your Name]';
      const candidateName = rawName
        .split(' ')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(' ');

      const userPrompt = this.fillPromptTemplate(
        prompts.COVER_LETTER_OPTIMIZATION_USER_PROMPT,
        {
          existingCoverLetter: existingCoverLetter,
          jobDescription: jobDescription,
          resumeData: JSON.stringify(resumeData, null, 2),
          customInstructions: customInstructions || 'None',
          candidateName: candidateName,
        },
      );

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: CoverLetterSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return {
        suggestions: result.object.suggestions,
      };
    } catch (error) {
      console.error('Cover letter optimization error:', error);
      throw new Error('Failed to optimize cover letter');
    }
  }

  /**
   * Optimize an existing Q&A answer
   */
  async optimizeQnA(
    question: string,
    currentAnswer: string,
    resumeData: ResumeData,
    jobDescription: string,
    customInstructions: string = '',
    userId: string,
  ): Promise<{ suggestions: string[] }> {
    try {
      // Use imported schema for structured output
      const systemPrompt = prompts.QNA_OPTIMIZATION_SYSTEM_PROMPT;

      const userPrompt = this.fillPromptTemplate(
        prompts.QNA_OPTIMIZATION_USER_PROMPT,
        {
          customInstructions: customInstructions || 'None',
          question: question,
          currentAnswer: currentAnswer,
          jobDescription: jobDescription,
          resumeData: JSON.stringify(resumeData, null, 2),
        },
      );

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: QnASchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return {
        suggestions: result.object.suggestions,
      };
    } catch (error) {
      console.error('Q&A optimization error:', error);
      throw error;
    }
  }

  /**
   * Generate multiple answer variations for interview questions
   */
  async generateQnA(
    question: string,
    resumeData: ResumeData,
    jobDescription: string,
    customInstructions: string = '',
    userId: string,
  ): Promise<{ suggestions: string[] }> {
    try {
      // Use imported schema for structured output
      const systemPrompt = prompts.QNA_GENERATION_SYSTEM_PROMPT;

      const userPrompt = this.fillPromptTemplate(
        prompts.QNA_GENERATION_USER_PROMPT,
        {
          customInstructions: customInstructions || 'None',
          question: question,
          jobDescription: jobDescription,
          resumeData: JSON.stringify(resumeData, null, 2),
        },
      );

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: QnASchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return {
        suggestions: result.object.suggestions,
      };
    } catch (error) {
      console.error('Q&A generation error:', error);
      throw new Error('Failed to generate answer variations');
    }
  }

  /**
   * Parse job description using structured AI output
   */
  async parseJobDescription(
    description: string,
    userId: string,
    url?: string,
  ): Promise<JobParserResult> {
    try {
      // Prepare the user prompt with description and optional URL
      const promptTemplate = url
        ? prompts.JOB_PARSER_USER_PROMPT_WITH_URL
        : prompts.JOB_PARSER_USER_PROMPT;

      const replacements: Record<string, string> = {
        description: description,
      };

      if (url) {
        replacements.url = url;
      }

      const userPrompt = this.fillPromptTemplate(promptTemplate, replacements);

      const result = await generateObject({
        model: await this.resolveModel(userId),
        schema: JobParserSchema,
        messages: [
          { role: 'system', content: prompts.JOB_PARSER_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: AI_CONFIG.TEMPERATURE.CONTENT_OPTIMIZATION,
      });

      return result.object;
    } catch (error) {
      console.error('Job parsing error:', error);
      throw error;
    }
  }
}
