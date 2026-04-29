"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye, EyeOff, KeyRound, RotateCcw, ChevronDown, ChevronsUpDown,
  Check, ExternalLink, Info,
} from "lucide-react";
import { PageHeader } from "@/components/custom/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAiSettings, updateAiSettings } from "@/lib/api/settings";
import { SubscriptionCard } from "@/components/billing/subscription-card";

// ─── Model registry (sourced from @ai-sdk type definitions) ─────────────────

const MODELS: Record<string, { label: string; value: string; note?: string }[]> = {
  gemini: [
    { value: "gemini-2.5-flash",              label: "Gemini 2.5 Flash",              note: "Recommended · fast & capable" },
    { value: "gemini-2.5-pro",                label: "Gemini 2.5 Pro",                note: "Most capable stable" },
    { value: "gemini-2.5-flash-lite",         label: "Gemini 2.5 Flash Lite",         note: "Lightweight · lowest cost" },
    { value: "gemini-3-pro-preview",          label: "Gemini 3 Pro (Preview)",        note: "Latest · most capable preview" },
    { value: "gemini-3-flash-preview",        label: "Gemini 3 Flash (Preview)",      note: "Latest · fast preview" },
    { value: "gemini-3.1-pro-preview",        label: "Gemini 3.1 Pro (Preview)",      note: "Latest · experimental" },
    { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite (Preview)", note: "Latest · lightweight preview" },
    { value: "gemini-2.0-flash",              label: "Gemini 2.0 Flash",              note: "Previous gen · stable" },
  ],
  openai: [
    { value: "gpt-4.1",                  label: "GPT-4.1",                   note: "Recommended · reliable flagship" },
    { value: "gpt-4.1-mini",             label: "GPT-4.1 Mini",              note: "Fast & cost-efficient" },
    { value: "gpt-4.1-nano",             label: "GPT-4.1 Nano",              note: "Lightweight" },
    { value: "gpt-5",                    label: "GPT-5",                     note: "Latest · most capable" },
    { value: "gpt-5-mini",               label: "GPT-5 Mini",                note: "Latest · fast & efficient" },
    { value: "gpt-5-nano",               label: "GPT-5 Nano",                note: "Latest · lightweight" },
    { value: "gpt-5-pro",                label: "GPT-5 Pro",                 note: "Latest · highest reasoning" },
    { value: "gpt-5-codex",              label: "GPT-5 Codex",               note: "Latest · code-focused" },
    { value: "gpt-5.1",                  label: "GPT-5.1",                   note: "Latest · improved flagship" },
    { value: "gpt-5.1-codex",            label: "GPT-5.1 Codex",             note: "Latest · code-focused" },
    { value: "gpt-4o",                   label: "GPT-4o",                    note: "Multimodal · reliable" },
    { value: "gpt-4o-mini",              label: "GPT-4o Mini",               note: "Lightweight" },
    { value: "o4-mini",                  label: "o4-mini",                   note: "Reasoning model" },
    { value: "o3",                       label: "o3",                        note: "Advanced reasoning" },
    { value: "o3-mini",                  label: "o3-mini",                   note: "Reasoning · faster" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-6",        label: "Claude Sonnet 4.6",         note: "Recommended · balanced flagship" },
    { value: "claude-opus-4-7",          label: "Claude Opus 4.7",           note: "Latest · most capable Claude" },
    { value: "claude-opus-4-6",          label: "Claude Opus 4.6",           note: "Powerful · stable" },
    { value: "claude-haiku-4-5",         label: "Claude Haiku 4.5",          note: "Fast & lightweight" },
    { value: "claude-sonnet-4-5",        label: "Claude Sonnet 4.5",         note: "Stable · previous gen" },
    { value: "claude-opus-4-5",          label: "Claude Opus 4.5",           note: "Powerful · previous gen" },
    { value: "claude-opus-4-1",          label: "Claude Opus 4.1",           note: "Older · stable" },
    { value: "claude-sonnet-4-0",        label: "Claude Sonnet 4.0",         note: "Older · stable" },
  ],
  deepseek: [
    { value: "deepseek-chat",              label: "DeepSeek V3 (Chat)",         note: "Recommended · flagship model" },
    { value: "deepseek-reasoner",          label: "DeepSeek R1 (Reasoner)",     note: "Advanced reasoning" },
  ],
  xai: [
    { value: "grok-3-fast",                label: "Grok 3 Fast",                note: "Recommended · fastest" },
    { value: "grok-3-mini-fast",           label: "Grok 3 Mini Fast",           note: "Fast & lightweight" },
    { value: "grok-3",                     label: "Grok 3",                     note: "Most capable Grok" },
    { value: "grok-3-mini",                label: "Grok 3 Mini",                note: "Balanced" },
    { value: "grok-2-vision",              label: "Grok 2 Vision",              note: "Vision model" },
    { value: "grok-2",                     label: "Grok 2",                     note: "Previous gen" },
  ],
  mistral: [
    { value: "mistral-large-latest",       label: "Mistral Large",              note: "Recommended · top-tier" },
    { value: "mistral-small-latest",       label: "Mistral Small",              note: "Fast & efficient" },
    { value: "mistral-saba-latest",        label: "Mistral Saba",               note: "Arabic-optimized" },
    { value: "pixtral-large-latest",       label: "Pixtral Large",              note: "Vision model" },
    { value: "codestral-latest",           label: "Codestral",                  note: "Code-optimized" },
  ],
  groq: [
    { value: "llama-4-scout-17b-16e-instruct",    label: "Llama 4 Scout",      note: "Recommended · fast & free" },
    { value: "llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick",  note: "Most capable Llama" },
    { value: "qwen-3-235b-a22b-instruct",          label: "Qwen 3 235B",       note: "Massive · top quality" },
    { value: "deepseek-r1-distill-qwen-32b",       label: "DeepSeek R1 Distill (Qwen 32B)", note: "Reasoning · fast" },
    { value: "deepseek-r1-distill-llama-70b",      label: "DeepSeek R1 Distill (Llama 70B)", note: "Reasoning · powerful" },
    { value: "gemma-3-27b-it",                     label: "Gemma 3 27B",       note: "Google · open weight" },
  ],
  openrouter: [
    { value: "google/gemini-2.5-flash",          label: "Gemini 2.5 Flash",         note: "Recommended · cheapest" },
    { value: "google/gemini-2.5-pro",            label: "Gemini 2.5 Pro",           note: "Most capable Gemini" },
    { value: "openai/gpt-4.1",                   label: "GPT-4.1",                  note: "Reliable flagship" },
    { value: "openai/gpt-4o",                    label: "GPT-4o",                   note: "Multimodal classic" },
    { value: "openai/o3-mini",                   label: "o3-mini",                  note: "Reasoning" },
    { value: "anthropic/claude-sonnet-4-6",      label: "Claude Sonnet 4.6",        note: "Balanced flagship" },
    { value: "anthropic/claude-opus-4-7",        label: "Claude Opus 4.7",          note: "Most capable" },
    { value: "deepseek/deepseek-chat",           label: "DeepSeek V3",              note: "Cheap & capable" },
    { value: "deepseek/deepseek-r1",             label: "DeepSeek R1",              note: "Reasoning king" },
    { value: "x-ai/grok-3",                      label: "Grok 3",                   note: "xAI flagship" },
    { value: "mistralai/mistral-large",          label: "Mistral Large",            note: "European heavyweight" },
    { value: "meta-llama/llama-4-maverick",      label: "Llama 4 Maverick",         note: "Open weight · powerful" },
    { value: "qwen/qwen3-235b-a22b",             label: "Qwen 3 235B",              note: "Massive open model" },
  ],
};

// ─── Provider config ─────────────────────────────────────────────────────────

const PROVIDERS = [
  {
    value: "gemini",
    label: "Google Gemini",
    description: "Google AI Studio — generous free tier",
    defaultModel: "gemini-2.5-flash",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlLabel: "Google AI Studio",
    steps: [
      "Go to Google AI Studio",
      'Click "Get API key" → "Create API key"',
      "Copy the key and paste it below",
    ],
    docsUrl: "https://ai.google.dev/gemini-api/docs",
  },
  {
    value: "openai",
    label: "OpenAI",
    description: "GPT-5, GPT-4.1, o-series — pay-as-you-go",
    defaultModel: "gpt-4.1",
    keyUrl: "https://platform.openai.com/api-keys",
    keyUrlLabel: "OpenAI Platform",
    steps: [
      "Go to OpenAI Platform → API keys",
      'Click "Create new secret key"',
      "Copy the key (shown only once) and paste it below",
    ],
    docsUrl: "https://platform.openai.com/docs/models",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    description: "Claude Sonnet & Opus — strong reasoning",
    defaultModel: "claude-sonnet-4-6",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "Anthropic Console",
    steps: [
      "Go to Anthropic Console → API Keys",
      'Click "Create Key", give it a name',
      "Copy the key and paste it below",
    ],
    docsUrl: "https://docs.anthropic.com/en/docs/about-claude/models",
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    description: "V3 & R1 — best price/performance ratio",
    defaultModel: "deepseek-chat",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyUrlLabel: "DeepSeek Platform",
    steps: [
      "Go to DeepSeek Platform → API Keys",
      'Click "Create new key"',
      "Copy the key and paste it below",
    ],
    docsUrl: "https://api-docs.deepseek.com/",
  },
  {
    value: "xai",
    label: "xAI (Grok)",
    description: "Grok 3 — real-time knowledge",
    defaultModel: "grok-3-fast",
    keyUrl: "https://console.x.ai/api-keys",
    keyUrlLabel: "xAI Console",
    steps: [
      "Go to xAI Console → API Keys",
      'Click "Create API key"',
      "Copy the key and paste it below",
    ],
    docsUrl: "https://docs.x.ai/docs",
  },
  {
    value: "mistral",
    label: "Mistral AI",
    description: "Large, Small, Codestral — European open models",
    defaultModel: "mistral-large-latest",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyUrlLabel: "Mistral Console",
    steps: [
      "Go to Mistral Console → API Keys",
      'Click "Create new key"',
      "Copy the key and paste it below",
    ],
    docsUrl: "https://docs.mistral.ai/",
  },
  {
    value: "groq",
    label: "Groq",
    description: "Ultra-fast inference — free tier available",
    defaultModel: "llama-4-scout-17b-16e-instruct",
    keyUrl: "https://console.groq.com/keys",
    keyUrlLabel: "Groq Console",
    steps: [
      "Go to Groq Console → API Keys",
      'Click "Create API Key"',
      "Copy the key and paste it below",
    ],
    docsUrl: "https://console.groq.com/docs",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    description: "Single key → 200+ models from every provider",
    defaultModel: "google/gemini-2.5-flash",
    keyUrl: "https://openrouter.ai/keys",
    keyUrlLabel: "OpenRouter",
    steps: [
      "Go to OpenRouter → Keys",
      'Click "Create Key"',
      "Copy the key and paste it below",
    ],
    docsUrl: "https://openrouter.ai/docs",
  },
] as const;

type ProviderValue = (typeof PROVIDERS)[number]["value"];

// ─── Model Combobox ───────────────────────────────────────────────────────────

function ModelCombobox({
  provider,
  value,
  onChange,
  placeholder,
}: {
  provider: ProviderValue | "";
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const models = provider ? (MODELS[provider] ?? []) : [];
  const selectedModel = models.find((m) => m.value === value);
  const displayValue = selectedModel ? selectedModel.label : value || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {displayValue || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type a custom model..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <button
                  className="w-full px-4 py-3 text-sm text-left hover:bg-accent transition-colors"
                  onClick={() => {
                    onChange(inputValue);
                    setInputValue("");
                    setOpen(false);
                  }}
                >
                  Use <span className="font-mono font-medium">"{inputValue}"</span>
                </button>
              ) : (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No models found
                </p>
              )}
            </CommandEmpty>
            {models.length > 0 && (
              <CommandGroup>
                {models.map((m) => (
                  <CommandItem
                    key={m.value}
                    value={m.value}
                    onSelect={(v) => {
                      onChange(v === value ? "" : v);
                      setInputValue("");
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-sm">{m.value}</span>
                      {m.note && (
                        <span className="text-xs text-muted-foreground">{m.note}</span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === m.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── API Key Guide ────────────────────────────────────────────────────────────

function ApiKeyGuide({ provider }: { provider: ProviderValue }) {
  const [open, setOpen] = useState(false);
  const p = PROVIDERS.find((x) => x.value === provider)!;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none">
        <Info className="h-3.5 w-3.5" />
        How to get your {p.label} API key
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <ol className="space-y-1.5">
            {p.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-3 pt-1">
            <a
              href={p.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Open {p.keyUrlLabel}
            </a>
            <span className="text-muted-foreground text-xs">·</span>
            <a
              href={p.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Model docs
            </a>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: getAiSettings,
  });

  const [provider, setProvider] = useState<ProviderValue | "">("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setProvider((settings.aiProvider as ProviderValue) || "");
    setApiKey(settings.aiApiKey || "");
    setModel(settings.aiModel || "");
    setInitialized(true);
  }

  const selectedProvider = PROVIDERS.find((p) => p.value === provider);
  const hasCustomKey = !!settings?.aiApiKey;

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAiSettings({
        aiProvider: provider || undefined,
        aiApiKey: apiKey || undefined,
        aiModel: model || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      toast.success("AI settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      updateAiSettings({ aiProvider: "", aiApiKey: "", aiModel: "" }),
    onSuccess: () => {
      setProvider("");
      setApiKey("");
      setModel("");
      setInitialized(false);
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      toast.success("Reverted to system defaults");
    },
    onError: () => toast.error("Failed to clear settings"),
  });

  return (
    <div className="space-y-6 py-6">
      <PageHeader
        title="Settings"
        description="Configure your personal AI provider and preferences."
        breadcrumbs={[{ label: "Settings" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* AI Provider Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <CardTitle>AI Provider</CardTitle>
              </div>
              {hasCustomKey ? (
                <Badge variant="secondary" className="text-xs">Custom key active</Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">Using system default</Badge>
              )}
            </div>
            <CardDescription>
              Use your own API key for full control over billing and usage. Leave
              blank to use the server-configured default.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Provider */}
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">Provider</Label>
                  <Select
                    value={provider}
                    onValueChange={(v) => {
                      setProvider(v as ProviderValue);
                      setModel("");
                    }}
                  >
                    <SelectTrigger id="ai-provider">
                      <SelectValue placeholder="Select a provider..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.label}</span>
                            <span className="text-xs text-muted-foreground">{p.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* API Key Guide */}
                {provider && <ApiKeyGuide provider={provider as ProviderValue} />}

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="ai-api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="ai-api-key"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        provider === "gemini"
                          ? "AIza..."
                          : provider === "openai"
                          ? "sk-..."
                          : provider === "anthropic"
                          ? "sk-ant-..."
                          : "Enter your API key..."
                      }
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showApiKey ? "Hide key" : "Show key"}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label>
                    Model{" "}
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <ModelCombobox
                    provider={provider as ProviderValue | ""}
                    value={model}
                    onChange={setModel}
                    placeholder={
                      selectedProvider
                        ? `Default: ${selectedProvider.defaultModel}`
                        : "Select a provider first..."
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Pick from the list or type any model name. Leave blank to use the provider default.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !provider || !apiKey}
                  >
                    {saveMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                  {hasCustomKey && (
                    <Button
                      variant="outline"
                      onClick={() => clearMutation.mutate()}
                      disabled={clearMutation.isPending}
                      className="gap-2"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {clearMutation.isPending ? "Reverting..." : "Use System Defaults"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
        {/* Subscription Card */}
        <SubscriptionCard />

        {/* Model Reference Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Reference</CardTitle>
            <CardDescription>
              Latest supported models — click a provider to expand.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible defaultValue="gemini">
              {PROVIDERS.map((p) => (
                <AccordionItem key={p.value} value={p.value}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{p.label}</span>
                      <a
                        href={p.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Docs
                      </a>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="rounded-md border divide-y text-sm">
                      {MODELS[p.value].map((m, i) => (
                        <div key={m.value} className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <code className="text-xs font-mono truncate">{m.value}</code>
                            {i === 0 && (
                              <Badge variant="secondary" className="text-xs h-4 px-1.5 shrink-0">
                                default
                              </Badge>
                            )}
                          </div>
                          {m.note && (
                            <span className="text-xs text-muted-foreground ml-2 shrink-0">
                              {m.note.replace(/Recommended · /, "")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
        </div>

      </div>
    </div>
  );
}
