export enum AIProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  [AIProvider.GEMINI]: 'gemini-2.5-flash',
  [AIProvider.OPENAI]: 'gpt-4o',
  [AIProvider.ANTHROPIC]: 'claude-sonnet-4-5',
};

/**
 * Allowlist of model IDs accepted per provider.
 * Mirrors the choices shown in the frontend settings page. Keep in sync.
 * Update both lists when adding/removing a model.
 */
export const ALLOWED_MODELS: Record<AIProvider, readonly string[]> = {
  [AIProvider.GEMINI]: [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.0-flash',
  ],
  [AIProvider.OPENAI]: [
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-5-pro',
    'gpt-5-codex',
    'gpt-5.1',
    'gpt-5.1-codex',
    'gpt-4o',
    'gpt-4o-mini',
    'o4-mini',
    'o3',
    'o3-mini',
  ],
  [AIProvider.ANTHROPIC]: [
    'claude-sonnet-4-6',
    'claude-opus-4-7',
    'claude-opus-4-6',
    'claude-haiku-4-5',
    'claude-sonnet-4-5',
    'claude-opus-4-5',
    'claude-opus-4-1',
    'claude-sonnet-4-0',
  ],
};

export function isValidProvider(value: unknown): value is AIProvider {
  return (
    typeof value === 'string' &&
    (Object.values(AIProvider) as string[]).includes(value)
  );
}

export function isValidModel(provider: AIProvider, model: string): boolean {
  return ALLOWED_MODELS[provider].includes(model);
}

export const AI_CONFIG = {
  TEMPERATURE: {
    RESUME_OPTIMIZATION: 0.7,
    CONTENT_OPTIMIZATION: 0.7,
    RESUME_PARSING: 0.1,
  },
  MAX_TOKENS: undefined,
};

// Hosted (Pro) tier: platform-managed Gemini Flash for everything
export const PLATFORM_MODEL = 'gemini-2.5-flash';
export const PRO_MONTHLY_CREDITS = 500;
export const PRO_DAILY_CALL_CAP = 100;
export const FREE_DAILY_CALL_CAP = 200;
