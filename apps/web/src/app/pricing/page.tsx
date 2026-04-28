import Link from "next/link";
import { FileText } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PricingPlans } from "@/components/pricing-plans";

export const metadata = {
  title: "Pricing — Jobs Optima",
  description:
    "Simple pricing for Jobs Optima. Free with your own AI key, or $5/month for managed AI.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" />
            </div>
            <span className="font-semibold">Jobs Optima</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, dirt-cheap pricing
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Free with your own AI key. $5/month if you want us to handle the AI.
            That&apos;s it.
          </p>
        </div>

        <PricingPlans />

        <div className="mx-auto mt-16 max-w-2xl space-y-6 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground">
              What counts as an &quot;operation&quot;?
            </h3>
            <p className="mt-1">
              One AI call: optimizing a resume against a job description, generating a cover letter,
              parsing a job posting, or improving a content block.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Why is Pro so cheap?
            </h3>
            <p className="mt-1">
              We use Gemini 2.5 Flash — fast and cheap enough to pass the savings on.
              Other tools charge $20–50/month and give you fewer operations.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Can I switch from Pro back to Free?
            </h3>
            <p className="mt-1">
              Yes. Cancel anytime. You stay on Pro until the end of your billing period,
              then revert to Free. Your data and resumes are preserved.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Is the project really open source?
            </h3>
            <p className="mt-1">
              Yes — MIT licensed. Self-host the entire stack with Docker Compose.{" "}
              <a
                href="https://github.com/l3lackcurtains/resume-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Browse the code on GitHub.
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Jobs Optima · MIT licensed</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
