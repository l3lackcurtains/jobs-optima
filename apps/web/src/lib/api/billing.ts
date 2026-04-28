import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface BillingStatus {
  plan: 'free' | 'pro';
  creditsRemaining: number;
  creditsResetAt: string | null;
  proMonthlyCredits: number;
  hasSubscription: boolean;
  /**
   * False when this instance has no Polar/billing env configured (OSS mode).
   * The UI should hide upgrade/manage CTAs in that case.
   */
  billingEnabled: boolean;
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const res = await apiClient.get(API_ENDPOINTS.BILLING_ME);
  return res.data;
}

export async function createCheckoutSession(): Promise<{ url: string }> {
  const res = await apiClient.post(API_ENDPOINTS.BILLING_CHECKOUT);
  return res.data;
}

export async function createPortalSession(): Promise<{ url: string }> {
  const res = await apiClient.post(API_ENDPOINTS.BILLING_PORTAL);
  return res.data;
}
