export type AtsType = "greenhouse" | "lever" | "ashby" | "workable";

export interface CuratedCompany {
  name: string;
  url: string;
  ats: AtsType;
}

export interface CompanyCategory {
  id: string;
  label: string;
  description: string;
  companies: CuratedCompany[];
}

/**
 * Curated list of companies with public ATS APIs.
 * URLs are the canonical patterns each ATS exposes; if a company is removed
 * or renames their board, the fetcher logs a warning and other sources still work.
 */
export const COMPANY_CATEGORIES: CompanyCategory[] = [
  {
    id: "ai-ml",
    label: "AI & ML",
    description: "AI labs, foundation models, and ML platforms",
    companies: [
      {
        name: "Anthropic",
        url: "https://job-boards.greenhouse.io/anthropic",
        ats: "greenhouse",
      },
      {
        name: "OpenAI",
        url: "https://job-boards.greenhouse.io/openai",
        ats: "greenhouse",
      },
      {
        name: "Hugging Face",
        url: "https://apply.workable.com/huggingface",
        ats: "workable",
      },
      {
        name: "Mistral AI",
        url: "https://jobs.ashbyhq.com/mistral",
        ats: "ashby",
      },
      {
        name: "Perplexity",
        url: "https://jobs.ashbyhq.com/perplexity",
        ats: "ashby",
      },
      {
        name: "Cohere",
        url: "https://jobs.lever.co/cohere",
        ats: "lever",
      },
      {
        name: "Scale AI",
        url: "https://job-boards.greenhouse.io/scaleai",
        ats: "greenhouse",
      },
      {
        name: "Databricks",
        url: "https://job-boards.greenhouse.io/databricks",
        ats: "greenhouse",
      },
      {
        name: "Replicate",
        url: "https://jobs.ashbyhq.com/replicate",
        ats: "ashby",
      },
      {
        name: "Hume AI",
        url: "https://job-boards.greenhouse.io/humeai",
        ats: "greenhouse",
      },
      {
        name: "ElevenLabs",
        url: "https://jobs.ashbyhq.com/elevenlabs",
        ats: "ashby",
      },
    ],
  },
  {
    id: "top-tech",
    label: "Top Tech",
    description: "Large, established tech companies",
    companies: [
      {
        name: "Airbnb",
        url: "https://job-boards.greenhouse.io/airbnb",
        ats: "greenhouse",
      },
      {
        name: "Stripe",
        url: "https://job-boards.greenhouse.io/stripe",
        ats: "greenhouse",
      },
      {
        name: "Pinterest",
        url: "https://job-boards.greenhouse.io/pinterest",
        ats: "greenhouse",
      },
      {
        name: "Coinbase",
        url: "https://job-boards.greenhouse.io/coinbase",
        ats: "greenhouse",
      },
      {
        name: "Cloudflare",
        url: "https://job-boards.greenhouse.io/cloudflare",
        ats: "greenhouse",
      },
      {
        name: "GitHub",
        url: "https://job-boards.greenhouse.io/github",
        ats: "greenhouse",
      },
      {
        name: "GitLab",
        url: "https://job-boards.greenhouse.io/gitlab",
        ats: "greenhouse",
      },
      {
        name: "Atlassian",
        url: "https://job-boards.greenhouse.io/atlassian",
        ats: "greenhouse",
      },
      {
        name: "Discord",
        url: "https://job-boards.greenhouse.io/discord",
        ats: "greenhouse",
      },
      {
        name: "Reddit",
        url: "https://jobs.lever.co/reddit",
        ats: "lever",
      },
      {
        name: "Netflix",
        url: "https://jobs.lever.co/netflix",
        ats: "lever",
      },
      {
        name: "Shopify",
        url: "https://jobs.lever.co/shopify",
        ats: "lever",
      },
    ],
  },
  {
    id: "dev-tools",
    label: "Dev Tools & Infra",
    description: "Developer tools, observability, and infrastructure",
    companies: [
      {
        name: "Vercel",
        url: "https://jobs.ashbyhq.com/vercel",
        ats: "ashby",
      },
      {
        name: "Linear",
        url: "https://jobs.ashbyhq.com/linear",
        ats: "ashby",
      },
      {
        name: "PostHog",
        url: "https://jobs.ashbyhq.com/posthog",
        ats: "ashby",
      },
      {
        name: "Supabase",
        url: "https://jobs.ashbyhq.com/supabase",
        ats: "ashby",
      },
      {
        name: "Neon",
        url: "https://jobs.ashbyhq.com/neon",
        ats: "ashby",
      },
      {
        name: "Replit",
        url: "https://jobs.ashbyhq.com/replit",
        ats: "ashby",
      },
      {
        name: "Sentry",
        url: "https://jobs.lever.co/sentry",
        ats: "lever",
      },
      {
        name: "Retool",
        url: "https://job-boards.greenhouse.io/retool",
        ats: "greenhouse",
      },
      {
        name: "Mux",
        url: "https://jobs.ashbyhq.com/mux",
        ats: "ashby",
      },
    ],
  },
  {
    id: "fintech",
    label: "Fintech",
    description: "Financial services and payments",
    companies: [
      {
        name: "Plaid",
        url: "https://job-boards.greenhouse.io/plaid",
        ats: "greenhouse",
      },
      {
        name: "Brex",
        url: "https://job-boards.greenhouse.io/brexinc",
        ats: "greenhouse",
      },
      {
        name: "Mercury",
        url: "https://jobs.ashbyhq.com/mercury",
        ats: "ashby",
      },
      {
        name: "Robinhood",
        url: "https://job-boards.greenhouse.io/robinhood",
        ats: "greenhouse",
      },
      {
        name: "Wise",
        url: "https://job-boards.greenhouse.io/wise",
        ats: "greenhouse",
      },
      {
        name: "Ramp",
        url: "https://jobs.ashbyhq.com/ramp",
        ats: "ashby",
      },
    ],
  },
  {
    id: "saas",
    label: "SaaS & Productivity",
    description: "Collaboration, productivity, and SaaS platforms",
    companies: [
      {
        name: "Notion",
        url: "https://jobs.ashbyhq.com/notion",
        ats: "ashby",
      },
      {
        name: "Figma",
        url: "https://job-boards.greenhouse.io/figma",
        ats: "greenhouse",
      },
      {
        name: "Asana",
        url: "https://job-boards.greenhouse.io/asana",
        ats: "greenhouse",
      },
      {
        name: "Intercom",
        url: "https://job-boards.greenhouse.io/intercom",
        ats: "greenhouse",
      },
      {
        name: "Loom",
        url: "https://jobs.lever.co/loom",
        ats: "lever",
      },
      {
        name: "Webflow",
        url: "https://job-boards.greenhouse.io/webflow",
        ats: "greenhouse",
      },
      {
        name: "Canva",
        url: "https://job-boards.greenhouse.io/canva",
        ats: "greenhouse",
      },
    ],
  },
];

export const ALL_CURATED_COMPANIES: CuratedCompany[] = COMPANY_CATEGORIES.flatMap(
  (c) => c.companies,
);
