import {
  Controller,
  Post,
  Get,
  Headers,
  Req,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { BillingService } from './billing.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

/**
 * Billing is dormant by default.
 * Enabled when POLAR_PRODUCT_ID + POLAR_ACCESS_TOKEN are set in env.
 * In OSS / self-host mode (no env), all billing endpoints return 404 and
 * `/billing/me` reports a static free-tier shape so the UI degrades cleanly.
 */
function billingEnabled(): boolean {
  return (
    !!process.env.POLAR_PRODUCT_ID && !!process.env.POLAR_ACCESS_TOKEN
  );
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyBilling(@Request() req: AuthenticatedRequest) {
    if (!billingEnabled()) {
      // Static "free-tier only" response so the frontend can render without
      // assuming a billing system exists.
      return {
        plan: 'free' as const,
        creditsRemaining: 0,
        creditsResetAt: null,
        proMonthlyCredits: 0,
        hasSubscription: false,
        billingEnabled: false,
      };
    }
    const billing = await this.billingService.getMyBilling(req.user.userId);
    return { ...billing, billingEnabled: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(@Request() req: AuthenticatedRequest) {
    if (!billingEnabled()) {
      throw new NotFoundException('Billing is not enabled on this instance.');
    }
    return this.billingService.createCheckoutSession(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  async createPortal(@Request() req: AuthenticatedRequest) {
    if (!billingEnabled()) {
      throw new NotFoundException('Billing is not enabled on this instance.');
    }
    return this.billingService.createPortalSession(req.user.userId);
  }

  @Post('webhooks/polar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handlePolarWebhook(
    @Req() req: ExpressRequest & { rawBody?: Buffer },
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (!billingEnabled()) {
      throw new NotFoundException('Billing is not enabled on this instance.');
    }
    const rawBody = req.rawBody?.toString('utf8');
    if (!rawBody) {
      throw new BadRequestException('Missing webhook body');
    }

    const valid = this.billingService.verifySignature(rawBody, headers);
    if (!valid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    await this.billingService.handleWebhook(event);
  }
}
