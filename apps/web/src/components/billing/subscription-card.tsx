"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, Sparkles, ArrowRight, ExternalLink, Loader2,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  getBillingStatus,
  createCheckoutSession,
  createPortalSession,
} from "@/lib/api/billing";

export function SubscriptionCard() {
  const { data: billing, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: getBillingStatus,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const handleUpgrade = async () => {
    setActionLoading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch {
      toast.error("Failed to open billing portal. Please try again.");
      setActionLoading(false);
    }
  };

  const isPro = billing?.plan === "pro";
  const creditsUsed = billing
    ? Math.max(0, billing.proMonthlyCredits - billing.creditsRemaining)
    : 0;
  const creditsPercent = billing?.proMonthlyCredits
    ? (creditsUsed / billing.proMonthlyCredits) * 100
    : 0;
  const resetDate = billing?.creditsResetAt
    ? new Date(billing.creditsResetAt).toLocaleDateString()
    : null;

  // Hide the entire card on instances where billing isn't configured (OSS mode).
  if (!isLoading && billing && !billing.billingEnabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Subscription</CardTitle>
          </div>
          {isPro ? (
            <Badge className="gap-1">
              <Sparkles className="h-3 w-3" />
              Pro
            </Badge>
          ) : (
            <Badge variant="outline">Free</Badge>
          )}
        </div>
        <CardDescription>
          {isPro
            ? "You're on the Pro plan with managed AI."
            : "Upgrade to Pro for managed AI — no API key needed."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 rounded bg-muted animate-pulse" />
            <div className="h-10 rounded bg-muted animate-pulse" />
          </div>
        ) : isPro && billing ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Credits used this period</span>
                <span className="font-medium tabular-nums">
                  {creditsUsed} / {billing.proMonthlyCredits}
                </span>
              </div>
              <Progress value={creditsPercent} className="h-2" />
              {resetDate && (
                <p className="text-xs text-muted-foreground">
                  Resets {resetDate}
                </p>
              )}
            </div>

            {billing.hasSubscription && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleManage}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Manage subscription
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">$5</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <p className="text-muted-foreground">
                500 AI ops/month · Gemini Flash · cancel anytime
              </p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleUpgrade}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
