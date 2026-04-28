import { PRO_MONTHLY_CREDITS } from '@modules/ai/ai.constants';

export const BILLING_CONFIG = {
  proMonthlyCredits: PRO_MONTHLY_CREDITS,
  polarApiBase: () =>
    process.env.POLAR_ENVIRONMENT === 'production'
      ? 'https://api.polar.sh'
      : 'https://sandbox-api.polar.sh',
};
