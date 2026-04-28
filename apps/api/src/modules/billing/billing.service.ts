import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '@schemas/user.schema';
import { BILLING_CONFIG } from './billing.constants';

interface PolarSubscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid';
  customer_id: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string>;
}

interface PolarOrder {
  id: string;
  customer_id: string;
  subscription_id?: string;
  status: string;
  metadata?: Record<string, string>;
}

interface PolarWebhookEvent {
  type: string;
  data: PolarSubscription | PolarOrder | Record<string, unknown>;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private get polarToken(): string {
    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token) {
      throw new InternalServerErrorException(
        'Billing is not configured. POLAR_ACCESS_TOKEN missing.',
      );
    }
    return token;
  }

  private get productId(): string {
    const id = process.env.POLAR_PRODUCT_ID;
    if (!id) {
      throw new InternalServerErrorException(
        'Billing is not configured. POLAR_PRODUCT_ID missing.',
      );
    }
    return id;
  }

  async createCheckoutSession(userId: string): Promise<{ url: string }> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new UnauthorizedException('User not found');

    const successUrl = process.env.POLAR_SUCCESS_URL;
    if (!successUrl) {
      throw new InternalServerErrorException(
        'Billing is not configured. POLAR_SUCCESS_URL missing.',
      );
    }

    const body = {
      products: [this.productId],
      customer_email: user.email,
      external_customer_id: String(user._id),
      success_url: successUrl,
      metadata: {
        userId: String(user._id),
      },
    };

    const res = await fetch(`${BILLING_CONFIG.polarApiBase()}/v1/checkouts/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.polarToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Polar checkout failed: ${res.status} ${text}`);
      throw new InternalServerErrorException(
        'Failed to create checkout session',
      );
    }

    const data = (await res.json()) as { url?: string };
    if (!data.url) {
      throw new InternalServerErrorException(
        'Polar did not return a checkout URL',
      );
    }
    return { url: data.url };
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.polarCustomerId) {
      throw new BadRequestException(
        'No active subscription. Upgrade first to manage billing.',
      );
    }

    const res = await fetch(
      `${BILLING_CONFIG.polarApiBase()}/v1/customer-sessions/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.polarToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id: user.polarCustomerId }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Polar portal failed: ${res.status} ${text}`);
      throw new InternalServerErrorException(
        'Failed to create portal session',
      );
    }

    const data = (await res.json()) as { customer_portal_url?: string };
    if (!data.customer_portal_url) {
      throw new InternalServerErrorException(
        'Polar did not return a portal URL',
      );
    }
    return { url: data.customer_portal_url };
  }

  /**
   * Verify a Polar webhook using the Standard Webhooks spec.
   * Header `webhook-signature` is `v1,<base64-hmac>` (may have multiple
   * versions space-separated). HMAC is computed over `${id}.${timestamp}.${body}`.
   */
  verifySignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('POLAR_WEBHOOK_SECRET not set');
      return false;
    }

    const id = headers['webhook-id'];
    const timestamp = headers['webhook-timestamp'];
    const signatureHeader = headers['webhook-signature'];

    if (!id || !timestamp || !signatureHeader) return false;

    const idStr = Array.isArray(id) ? id[0] : id;
    const tsStr = Array.isArray(timestamp) ? timestamp[0] : timestamp;
    const sigStr = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    // Standard Webhooks: secret may be prefixed with "whsec_" — strip it.
    const rawSecret = secret.startsWith('whsec_')
      ? secret.slice(6)
      : secret;
    const secretBytes = Buffer.from(rawSecret, 'base64');

    const signedPayload = `${idStr}.${tsStr}.${rawBody}`;
    const expected = crypto
      .createHmac('sha256', secretBytes)
      .update(signedPayload)
      .digest('base64');

    // Header may contain multiple "v1,sig" pairs separated by spaces.
    const pairs = sigStr.split(' ');
    for (const pair of pairs) {
      const [version, sig] = pair.split(',');
      if (version !== 'v1' || !sig) continue;
      try {
        if (
          crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
        ) {
          return true;
        }
      } catch {
        // length mismatch — keep trying
      }
    }
    return false;
  }

  async handleWebhook(event: PolarWebhookEvent): Promise<void> {
    this.logger.log(`Polar webhook: ${event.type}`);

    switch (event.type) {
      case 'subscription.created':
      case 'subscription.active':
        await this.activateSubscription(event.data as PolarSubscription);
        break;
      case 'subscription.updated':
        await this.syncSubscription(event.data as PolarSubscription);
        break;
      case 'subscription.canceled':
      case 'subscription.revoked':
        await this.cancelSubscription(event.data as PolarSubscription);
        break;
      case 'order.paid':
        await this.handleOrderPaid(event.data as PolarOrder);
        break;
      default:
        this.logger.debug(`Ignoring event type ${event.type}`);
    }
  }

  private async findUserFromSubscription(
    sub: PolarSubscription,
  ): Promise<UserDocument | null> {
    // Prefer metadata.userId set at checkout creation
    const metaUserId = sub.metadata?.userId;
    if (metaUserId) {
      const user = await this.userModel.findById(metaUserId).exec();
      if (user) return user;
    }
    // Fallback: look up by polarCustomerId we may have stored previously
    return this.userModel
      .findOne({ polarCustomerId: sub.customer_id })
      .exec();
  }

  private async activateSubscription(sub: PolarSubscription): Promise<void> {
    const user = await this.findUserFromSubscription(sub);
    if (!user) {
      this.logger.warn(
        `No user matched subscription ${sub.id} (customer ${sub.customer_id})`,
      );
      return;
    }

    user.plan = 'pro';
    user.creditsRemaining = BILLING_CONFIG.proMonthlyCredits;
    user.creditsResetAt = sub.current_period_end
      ? new Date(sub.current_period_end)
      : null;
    user.polarCustomerId = sub.customer_id;
    user.polarSubscriptionId = sub.id;
    user.dailyCallsCount = 0;
    user.dailyCallsResetAt = null;
    await user.save();
  }

  private async syncSubscription(sub: PolarSubscription): Promise<void> {
    const user = await this.findUserFromSubscription(sub);
    if (!user) return;

    if (sub.status === 'active' || sub.status === 'trialing') {
      user.plan = 'pro';
      // Refill credits if we crossed into a new billing period.
      const newPeriodEnd = sub.current_period_end
        ? new Date(sub.current_period_end)
        : null;
      const crossed =
        newPeriodEnd &&
        (!user.creditsResetAt ||
          newPeriodEnd.getTime() > user.creditsResetAt.getTime());
      if (crossed) {
        user.creditsRemaining = BILLING_CONFIG.proMonthlyCredits;
        user.creditsResetAt = newPeriodEnd;
      }
      user.polarCustomerId = sub.customer_id;
      user.polarSubscriptionId = sub.id;
    } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
      // Stay on Pro until period end; downgrade happens on revoked event.
      // Just keep records in sync.
      user.polarSubscriptionId = sub.id;
    }
    await user.save();
  }

  private async cancelSubscription(sub: PolarSubscription): Promise<void> {
    const user = await this.findUserFromSubscription(sub);
    if (!user) return;

    user.plan = 'free';
    user.creditsRemaining = 0;
    user.creditsResetAt = null;
    user.polarSubscriptionId = null;
    await user.save();
  }

  private async handleOrderPaid(order: PolarOrder): Promise<void> {
    // Recurring renewal: refill credits if this order ties to a known sub.
    if (!order.subscription_id) return;
    const user = await this.userModel
      .findOne({ polarSubscriptionId: order.subscription_id })
      .exec();
    if (!user) return;

    user.plan = 'pro';
    user.creditsRemaining = BILLING_CONFIG.proMonthlyCredits;
    // creditsResetAt is updated by the subscription.updated event that
    // typically accompanies a renewal; leave it alone here.
    await user.save();
  }

  async getMyBilling(userId: string): Promise<{
    plan: 'free' | 'pro';
    creditsRemaining: number;
    creditsResetAt: Date | null;
    proMonthlyCredits: number;
    hasSubscription: boolean;
  }> {
    const user = await this.userModel
      .findById(userId)
      .select(
        'plan creditsRemaining creditsResetAt polarSubscriptionId',
      )
      .lean()
      .exec();
    if (!user) throw new UnauthorizedException('User not found');

    return {
      plan: user.plan ?? 'free',
      creditsRemaining: user.creditsRemaining ?? 0,
      creditsResetAt: user.creditsResetAt ?? null,
      proMonthlyCredits: BILLING_CONFIG.proMonthlyCredits,
      hasSubscription: !!user.polarSubscriptionId,
    };
  }
}
