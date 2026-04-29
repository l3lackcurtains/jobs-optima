# Auto-Apply Pivot — Roadmap

Strategic pivot from "AI resume builder" to **"apply autopilot"**: an AI agent
that finds matching jobs, generates tailored resumes + cover letters, fills out
ATS forms, and submits applications on the user's behalf (with human approval
in v1).

This document is the implementation plan. The strategic rationale lives at the
bottom under [Why pivot](#why-pivot).

---

## Outcome

A product that, for ~$40–60/mo, lets a job seeker:

1. Set criteria (titles, locations, salary, must-haves) once.
2. Wake up to a daily batch of 5–15 great-match jobs with **already-tailored**
   resumes, cover letters, and pre-filled application forms.
3. Click "Approve" on each (or use "Approve all" once they trust it).
4. The system submits them in the background and reports outcomes.

The core differentiator vs Sonara/Massive/JobCopilot is **quality, not volume**:
fewer applications, each with a per-job tailored resume + AI relevance score.

---

## What we already have (~70% of the substrate)

| Asset | Module | Status |
|---|---|---|
| Job discovery (APIs + scrape) | `apps/api/src/modules/job-scanner` | ✅ Ships today |
| Per-job resume tailoring | `apps/api/src/modules/ai` (optimizer prompts) | ✅ Ships today |
| Cover letter generation | `apps/api/src/modules/ai` (cover letter prompts) | ✅ Ships today |
| Application tracking + timeline | `apps/api/src/modules/application` | ✅ Ships today |
| Multi-provider AI / BYOK | `apps/api/src/modules/ai` | ✅ Ships today |
| Profile module (foundation) | `apps/api/src/modules/profile` | ⚠️ Schema needs expansion |
| Anti-detection scraping infra | `apps/api/src/modules/job-scanner` | ✅ Reusable for ATS submission |
| Chrome extension shell | `apps/extension` | ✅ Critical for LinkedIn Easy Apply |
| BullMQ background queue | `apps/api/src/modules/job-scanner` (Redis) | ✅ Reuse for submission queue |
| PDF rendering | `apps/api/src/modules/documents` | ⚠️ Need ATS-friendly variant |

---

## What's missing (the actual product)

### 1. Profile schema expansion

ATSes ask 30–50 fields per application. The current profile module covers
work history and basic info. Need a structured store for **every** ATS
question that has ever been asked, with an LLM-answered fallback for novel
questions (cached by question hash so each is answered once, not per-app).

**New profile sections:**

- **Identity / contact**: legal name, preferred name, pronouns, phone, address
- **Work authorization**: country, sponsorship needed, visa type, start date
- **Compensation**: target salary, currency, equity expectations
- **EEO / demographic**: race, ethnicity, gender, veteran status, disability
  (all optional, "decline to answer" defaults)
- **Standard screening**: salary expectations, notice period, willing to
  relocate, references, links (LinkedIn, GitHub, portfolio)
- **Custom Q&A bank**: free-form `{ questionHash, question, answer, source }`
  entries. Source = "user" (manually answered) or "llm-cached" (auto-answered
  and approved on first encounter)
- **Per-target overrides**: "Why this company?" can be templated by company
  category (AI lab, fintech, etc.)

### 2. ATS submission adapters

One Playwright-based adapter per ATS family. **This is the hardest part of
the project.**

| ATS | Difficulty | Coverage | Notes |
|---|---|---|---|
| **Greenhouse** | Easy | ~25% of tech jobs | Well-known forms, occasional public APIs. Start here. |
| **Lever** | Easy | ~10% | Same patterns as Greenhouse. |
| **Ashby** | Medium | ~10% | Has posting API for many companies. |
| **Workable** | Medium | ~5% | Form-based, similar to Greenhouse. |
| **LinkedIn Easy Apply** | Hard | ~30% | Session auth, ToS risk, aggressive anti-bot. **Run via Chrome extension** to act in user's logged-in session and avoid server-side automation. |
| **Workday** | Brutal | ~15% | Multi-step JS, account-required, anti-bot. Sonara/Massive spent ~2 years cracking this. v3+ if at all. |
| **Custom corporate** | Case-by-case | ~5% | Skip in v1. |

**Adapter interface:**

```typescript
interface AtsAdapter {
  readonly id: string; // 'greenhouse' | 'lever' | ...
  detect(url: string): boolean;
  submit(args: {
    jobUrl: string;
    profile: Profile;
    resumePdf: Buffer;
    coverLetter: string;
    onQuestion: (q: UnknownQuestion) => Promise<string>; // LLM fallback
    onCaptcha: () => Promise<void>; // notify user / pause
    page: Page; // Playwright page
  }): Promise<SubmissionResult>;
}

interface SubmissionResult {
  status: 'submitted' | 'queued_for_review' | 'failed';
  confirmationId?: string;
  submittedAt?: Date;
  screenshots: Buffer[]; // before-submit + confirmation page
  failureReason?: string;
  novelQuestions?: { question: string; answer: string }[]; // for profile feedback loop
}
```

### 3. Submission orchestrator

BullMQ queue (already wired up). One job per application:

```
[scan finds match]
  → [AI relevance gate] → drop if score < threshold
  → [generate tailored resume + cover letter]
  → [render ATS-friendly PDF]
  → [enqueue submission job, status: queued]
  → [user reviews batch in UI]
  → [user approves → status: approved]
  → [worker picks up → adapter.submit()]
  → [screenshot, record confirmationId, mark submitted]
  → [if failed: classify (form-changed | rate-limit | captcha | locked)]
  → [retry strategy by failure class]
```

**Failure modes & responses:**

| Failure | Response |
|---|---|
| Form structure changed | Re-parse with LLM, retry once. If still fails, queue for human review and notify Slack. |
| Rate limited | Exponential backoff, schedule retry in N hours. |
| Captcha | Mark as `needs_human`, notify user via email/extension. They can solve in their browser. |
| Account locked / login expired | Pause all submissions for that ATS, notify user to re-auth. |
| Already applied | Mark as duplicate, no error to user. |

### 4. Human-in-the-loop approval flow

**Don't ship full autopilot in v1.** The flow:

1. Background scanner finds N matches per day
2. Relevance gate filters to top 5–15
3. For each, AI generates tailored resume + cover letter (uses existing
   optimizer prompts)
4. User opens "Today's Batch" screen and sees:
   - Job card with company, title, salary, match reasons
   - Tailored resume preview (diff vs base resume)
   - Cover letter preview
   - All form answers (especially novel ones flagged for first review)
   - Approve / Skip / Edit per item
5. User clicks "Submit batch" → workers submit each in background
6. Dashboard streams status (queued → submitting → submitted | failed)
7. Submitted apps appear in existing `application` tracker with full timeline

This is ~80% as valuable as full autopilot, way safer, and avoids the
"you trashed my reputation" risk. Once a user has approved 50+ batches with
0 issues, offer "auto-approve top-scoring matches" as an opt-in.

### 5. Polish

- ATS-friendly PDF generator (no images, simple formatting, embedded fonts,
  semantic structure)
- Per-application screenshot archive (for trust + dispute resolution)
- Daily email summary
- Rate caps per user (max 30 submissions/day) to prevent abuse
- Activity dashboard with metrics: applied / interviews / offers funnel
- Profile completeness meter ("you'll skip these jobs until you fill in X")

---

## Module structure

New module:

```
apps/api/src/modules/auto-apply/
  auto-apply.module.ts
  auto-apply.service.ts          ← orchestration entry point
  auto-apply.controller.ts       ← /auto-apply/batch, /auto-apply/approve, etc.
  auto-apply.processor.ts        ← BullMQ worker
  auto-apply.constants.ts
  schemas/
    submission.schema.ts         ← per-application submission record
    profile-qa.schema.ts         ← cached question/answer bank
  adapters/
    base.adapter.ts              ← AtsAdapter interface
    greenhouse.adapter.ts
    lever.adapter.ts
    ashby.adapter.ts
    workable.adapter.ts
    linkedin-easy-apply.adapter.ts  ← extension-bridged
    index.ts                     ← detect(url) → adapter
  form-parser/
    field-mapper.ts              ← maps form questions to profile fields
    novel-question-resolver.ts   ← LLM-backed Q&A for unknown questions
  pdf/
    ats-pdf-renderer.ts          ← stripped-down PDF for ATS parsing
```

Frontend:

```
apps/web/src/app/(dashboard)/auto-apply/
  page.tsx                       ← today's batch + history
  batch/[id]/page.tsx            ← per-batch review screen
  components/
    batch-card.tsx
    submission-status-row.tsx
    novel-question-modal.tsx     ← first-time question approval
```

Extension (LinkedIn Easy Apply path):

```
apps/extension/entrypoints/
  background.ts                  ← already exists
  content/
    linkedin-easy-apply.ts       ← injects into LinkedIn application pages
  sidepanel/
    auto-apply-tab.tsx           ← tab in existing sidepanel
```

Application module updates:

- Extend `ApplicationStatus` with: `QUEUED`, `READY_FOR_REVIEW`, `APPROVED`,
  `SUBMITTING`, `NEEDS_HUMAN`, `FAILED`
- New fields: `submissionRecordId`, `screenshots`, `novelQuestionsAsked`

---

## Phased delivery

### Phase 0 — Validation (1 week, before any code)

- [ ] Pick **target niche** (engineers? AI/ML? early-career? remote-only?). The landing page needs to be specific.
- [ ] Decide **autopilot vs assist** (recommend assist for v1).
- [ ] Recruit 5 friends/network as alpha testers.
- [ ] **Manually run the flow** for 1 week per tester: you find jobs, you tailor resumes, you fill forms (with their permission and a recorded session). Validates demand before building.
- [ ] Confirm willingness-to-pay at target price ($40–60/mo).

**Skip-or-pivot decision point.** If <3 of 5 testers say "I'd pay $50/mo for
this," don't build it. Try the cold-outreach pivot instead.

### Phase 1 — Profile + Greenhouse + Lever (3–4 weeks)

- [ ] Expand profile schema (identity, work auth, EEO, custom Q&A bank)
- [ ] Profile completion UI in dashboard
- [ ] `AtsAdapter` interface + `base.adapter.ts`
- [ ] `greenhouse.adapter.ts` — happy-path submission
- [ ] `lever.adapter.ts` — happy-path submission
- [ ] Manually test adapters on 20 real applications each
- [ ] Submission record schema + per-app screenshots
- [ ] Coverage: ~35% of tech jobs in your scanner results

**Demo gate:** alpha testers can submit one application end-to-end with
a single button click.

### Phase 2 — Approval flow + dashboard (2–3 weeks)

- [ ] "Today's Batch" review screen
- [ ] AI relevance gate + match score in batch UI
- [ ] BullMQ submission worker with retry policy
- [ ] Per-submission status streaming (extend existing scan-status-dialog pattern)
- [ ] Failure classification + handler routing (form-changed / captcha / rate-limit / locked)
- [ ] Daily email summary (or in-app notification)

**Demo gate:** alpha tester wakes up to a batch of 5 tailored applications,
reviews and approves in <5 minutes, gets confirmation that all 5 submitted
within an hour. End-to-end works for one person, no babysitting.

### Phase 3 — Ashby + Workable + LinkedIn Easy Apply (3–4 weeks)

- [ ] `ashby.adapter.ts` (use posting API where available, Playwright otherwise)
- [ ] `workable.adapter.ts`
- [ ] LinkedIn Easy Apply via **Chrome extension** (not server-side):
    - Extension content script detects Easy Apply page
    - Pulls user's profile + tailored resume from your API
    - Fills form in-page, user clicks final submit
    - Records outcome back to your API
- [ ] Coverage: ~75% of tech jobs

**Demo gate:** 20 paying customers running with <10% manual intervention rate.

### Phase 4 — Polish + monetization (2–3 weeks)

- [ ] ATS-friendly PDF renderer
- [ ] Activity dashboard with funnel metrics (applied / replies / interviews / offers)
- [ ] Rate caps + abuse prevention
- [ ] Pricing page + Polar.sh subscription flow
    - Free: 10 auto-applies/month + assist mode only
    - Pro $49/mo: 200 auto-applies/month + auto-approve high scores
    - Premium $99/mo: unlimited + priority queue + Workday (if shipped)
- [ ] Public landing page with niche-specific positioning

**Launch gate:** post on HN/IndieHackers, target 100 paying users in
first 30 days.

### Phase 5 — Workday + LinkedIn full + scale (4+ weeks, optional)

- [ ] `workday.adapter.ts` — only if your target users apply to BigCo
- [ ] LinkedIn full automation (bypass Easy Apply restriction) — only if
      legal review clears it
- [ ] Multi-tenant proxy pools per ATS
- [ ] Adapter health monitoring + auto-rollback on >X% failure rate

---

## Realistic timeline

| Mode | Timeline to v1 |
|---|---|
| Solo, full-time, focused | 14–18 weeks |
| Solo, half-time | 6–9 months |
| Solo, evenings/weekends | Don't. The maintenance burden alone will exceed your bandwidth. |

This is **not a feature you bolt onto the resume builder**. It's the new core.

---

## Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Workday is ~15% of jobs and brutal to crack | High | Skip in v1. Position around "all the jobs that aren't Workday." Add in v3 if user demand is loud. |
| LinkedIn ToS prohibits automation | High | Run via extension only (acts in user's session, paced like a human). Never automate from server. Document this clearly to users. |
| Form changes break adapters constantly | High | Build a per-adapter test suite that runs daily on real boards. Auto-rollback when failure rate spikes. Set user expectation: "we self-heal within 24h." |
| Trust crisis ("you sent the wrong resume to my dream job") | Catastrophic | Approval flow + screenshot before submit + viewable archive of every submission. Default to assist mode, never auto. |
| Quality dilution (spam-tier applications) | High | Aggressive AI relevance gate. Cap at 20–30/day per user. Marketing positioning: "5 great applications > 100 spammy ones." |
| Anti-bot arms race | Medium | You already have the scraping infra. Plan for residential proxies + captcha solver budget (~$50/mo per 1000 active users). |
| Account lockouts (LinkedIn, Workday) | Medium | Conservative pacing + browser fingerprint randomization. Detect and pause on suspicious responses. |
| Competition from Sonara/Massive | Medium | Quality positioning + niche focus. Don't compete on volume; compete on match relevance + tailored content. |
| LLM cost per application | Medium | Cache novel question answers. Use Gemini Flash (cheap). Estimated ~$0.15 per application = $1.50/user/month at 10 apps. Profitable at $49/mo even with proxies. |
| ATS legal/ToS sweep | Low–Medium | Get a 1-hour legal consult before launch. Register as user-acting agent, not corporate scraper. |

---

## What NOT to do

- Don't try to build all 8 ATS adapters at once. Greenhouse + Lever first, prove the loop, then expand.
- Don't promise "full autopilot" in marketing v1. "AI applies on your approval" is the truthful and easier-to-build pitch.
- Don't underestimate profile completeness — half the magic is having the user's info pre-structured for autofill. Bad UX here = users churn before applying once.
- Don't skip the screenshot-before-submit feature. It's the trust anchor.
- Don't run LinkedIn automation from the server. Extension only.

---

## Differentiator angles (marketing positioning)

Pick **one** of these. Don't dilute:

1. **"Quality > volume"** — 5 hand-tailored applications/day, never spam. Lean on your existing AI relevance scoring.
2. **"Per-job tailored resumes, not one-size-fits-all"** — competitors apply the same resume everywhere. You don't.
3. **"Niche specialist"** — "for senior backend engineers" / "for AI/ML researchers" / "for early-career grads". Niche down hard for the landing page.
4. **"Transparent activity"** — full submission archive with screenshots and the actual answers used. Trust > volume.

Recommended combo: #2 + #3.

---

## Why pivot

(Strategic context for future-you re-reading this.)

The horizontal AI resume-builder category is being squeezed:

- **From below:** ChatGPT/Claude/Gemini do "tailor my resume for this JD" for $0–20/mo, conversationally, with no friction.
- **From above:** Apply autopilot agents (Sonara, Massive, JobCopilot, LazyApply) do the actual job-getting workflow.
- **In the middle:** Resume editing is once-or-twice-a-year activity for most people. No daily-active habit, no workflow lock-in. Users churn the moment they're hired.

Resume optimization alone is a feature, not a product, in 2026. The data
moat for a real product comes from the workflow: discovery + tailoring +
submission + tracking + reply detection. We have everything except
submission. Building submission is the pivot.

The risk of NOT pivoting: launching as a generic resume builder, getting
buried by Resume.io / Teal SEO and ChatGPT free-tier, churning at month 2
of every user lifecycle, never reaching profitability.

The risk of pivoting: 3–4 months of focused work, real maintenance burden
on adapters, ToS risk on LinkedIn. But unit economics work at $49/mo if
volume + quality are both real.

---

## Decision checklist before committing

- [ ] I can commit 14–18 weeks of focused work (not evenings)
- [ ] I've validated demand with 5 manual-mode alpha testers
- [ ] I've picked a niche tighter than "engineers"
- [ ] I've decided assist-mode-first (not full autopilot in v1)
- [ ] I've accepted that Workday is v3+ or never
- [ ] I've accepted ongoing adapter maintenance as a permanent cost
- [ ] I have $200–500/mo budget for proxies + captcha solving + LLM costs

If 6+ of 7 are checked: build it. If 4–5: do Phase 0 only and re-evaluate.
If <4: try the cold-outreach pivot instead (smaller scope, ~6 weeks).
