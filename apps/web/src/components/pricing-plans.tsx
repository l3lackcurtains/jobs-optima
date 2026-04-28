"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Check, KeyRound, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createCheckoutSession, getBillingStatus } from "@/lib/api/billing";

const freeFeatures = [
  "All optimization features",
  "Unlimited resumes & profiles",
  "Job scanner & application tracker",
  "Chrome extension autofill",
  "Bring your own API key",
  "Self-hostable, MIT licensed",
];

const proFeatures = [
  "Everything in Free",
  "500 AI operations / month",
  "Managed Gemini Flash — no API key needed",
  "Cancel anytime",
  "Priority support",
];

export function PricingPlans({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Only authenticated users have a billing context. For visitors on the
  // public landing/pricing pages we just assume billing might exist and
  // let the checkout endpoint return 404 if not — handled in handleUpgrade.
  const { data: billing } = useQuery({
    queryKey: ["billing-status"],
    queryFn: getBillingStatus,
    enabled: status === "authenticated",
  });
  const billingEnabled = billing?.billingEnabled ?? true;

  const handleUpgrade = async () => {
    if (status !== "authenticated" || !session?.user) {
      router.push("/signup?intent=upgrade");
      return;
    }
    setLoading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      toast.error("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  // OSS instance with no Polar configured → only show the Free plan card.
  if (status === "authenticated" && !billingEnabled) {
    return (
      <div
        className={`mx-auto max-w-md ${compact ? "" : "mt-12"}`}
      >
        <Card className="border shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Free forever</h3>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold tracking-tight">$0</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This instance is open-source only. Bring your own AI API key to use the optimization features.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  Go to dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto grid max-w-4xl gap-6 md:grid-cols-2 ${compact ? "" : "mt-12"}`}
    >
      <Card className="border shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Free</h3>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold tracking-tight">$0</span>
            <span className="text-muted-foreground"> / month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Bring your own AI API key. Pay only what you use, directly to your provider.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {status === "authenticated" ? (
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full">
                  Get started free
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="relative border-2 border-primary shadow-md">
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
          <Sparkles className="h-3 w-3" />
          Recommended
        </Badge>
        <CardContent className="p-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Pro</h3>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold tracking-tight">$5</span>
            <span className="text-muted-foreground"> / month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            We handle the AI. Just sign in, paste a job, get an optimized resume.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button
              className="w-full gap-2"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
