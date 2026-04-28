import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  Target,
  Zap,
  Github,
  KeyRound,
  Layers,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: Target,
    title: "ATS-optimized resumes",
    body: "AI rewrites your resume for each job description, lifting ATS scores and matching the exact keywords recruiters search for.",
  },
  {
    icon: Search,
    title: "Job scanner",
    body: "Save searches across LinkedIn, Indeed, and others. New matches stream into your dashboard with relevance scoring.",
  },
  {
    icon: Layers,
    title: "Multiple profiles",
    body: "Maintain frontend, backend, and ML profiles side-by-side. One click to apply with the right one for each role.",
  },
  {
    icon: Sparkles,
    title: "Cover letters & Q&A",
    body: "Generate tailored cover letters and answer interview questions grounded in your real experience — no hallucinations.",
  },
  {
    icon: ScanLine,
    title: "Chrome autofill",
    body: "Browser extension fills Greenhouse, Workable, Lever, Workday, and Ashby application forms from your profile.",
  },
  {
    icon: KeyRound,
    title: "Bring your own key",
    body: "Use your own Gemini, OpenAI, or Anthropic API key. Your resumes never train someone else's model.",
  },
];

const steps = [
  {
    n: "01",
    title: "Upload your resume",
    body: "Drop in a PDF or DOCX. We parse it into structured data you can edit.",
  },
  {
    n: "02",
    title: "Add a job description",
    body: "Paste a posting or import from a saved search. Our parser pulls out role, skills, and required keywords.",
  },
  {
    n: "03",
    title: "Optimize and apply",
    body: "AI tailors a resume for the job, scores it against the JD, and tracks the application alongside your pipeline.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

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
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a
              href="https://github.com/l3lackcurtains/resume-builder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5">
              <Sparkles className="h-3 w-3" />
              100% free · Open source · Self-hostable
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Beat the ATS.
              <br />
              <span className="text-primary">Land the interview.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              The free, open-source AI resume optimizer. Bring your own Gemini, OpenAI, or Anthropic key — your resumes never train someone else&apos;s model.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get started — free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="https://github.com/l3lackcurtains/resume-builder" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  <Github className="h-4 w-4" />
                  Star on GitHub
                </Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card, no signup tricks. MIT licensed. Self-host or use the hosted demo.
            </p>
          </div>
        </section>

        <section id="features" className="border-y bg-muted/30">
          <div className="container mx-auto px-4 py-20 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to job hunt smarter
              </h2>
              <p className="mt-4 text-muted-foreground">
                One workspace for resumes, profiles, applications, and the AI that ties them together.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="container mx-auto px-4 py-20 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From upload to interview in 3 steps</h2>
            <p className="mt-4 text-muted-foreground">
              Most users see their first AI-optimized resume in under two minutes.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="text-5xl font-bold text-primary/20 tabular-nums">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="container mx-auto grid gap-12 px-4 py-20 md:grid-cols-2 md:py-24">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Zap className="h-3 w-3" />
                Privacy first
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Your resumes never train someone else&apos;s AI
              </h2>
              <p className="mt-4 text-muted-foreground">
                Jobs Optima ships with no model lock-in. Plug in your own Gemini, OpenAI, or Anthropic key from Settings and every AI call goes directly from your account to the provider.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Gemini, OpenAI, and Anthropic supported out of the box",
                  "Self-host the entire stack with Docker Compose",
                  "Open source under MIT — fork it, audit it, run it",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-0 shadow-md">
              <CardContent className="p-8">
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                    <span className="font-mono text-xs">Settings → AI Provider</span>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="text-xs text-muted-foreground">Provider</div>
                    <div className="mt-1 font-medium">Anthropic</div>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="text-xs text-muted-foreground">Model</div>
                    <div className="mt-1 font-medium">claude-sonnet-4-6</div>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="text-xs text-muted-foreground">API Key</div>
                    <div className="mt-1 font-mono text-sm">sk-ant-••••••••••••</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Custom key active
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center shadow-sm">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to land more interviews?</h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Sign up, paste your resume, and get an AI-tailored version in under two minutes. Free forever.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get started — free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="ghost">I already have an account</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Jobs Optima</span>
            <span>·</span>
            <span>Open source under MIT</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com/l3lackcurtains/resume-builder"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
