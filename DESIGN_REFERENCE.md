# Spacefit — Design Reference

**Purpose:** Single source of truth for UX/UI patterns. Use as reference when building new screens, running design skills (`figma:figma-generate-design`, `frontend-design:frontend-design`, `gan-design`), or briefing designers.

**Audience:** India-first fitness tracking + B2B gym SaaS. Mobile-first PWA, desktop-friendly admin.

**Last updated:** 2026-05-10

---

## 1. Research foundation

Built from analyzing live apps. Sources at end.

| App | What we steal | What we avoid |
|-----|---------------|---------------|
| **Cal AI** ($35M Y1) | Photo-first capture, dominant single CTA, calorie ring, narrative onboarding | Aggressive paywall, weak macro accuracy on complex dishes |
| **HealthifyMe** | 20K Indian foods, Hindi names inline, AI coach pattern, regional language support | Slow search, upsell spam, cluttered tabs |
| **Cult.fit** | Streak gamification, single-tap class booking, OTP login, bottom tabs | Too many duplicate CTAs, lag without loading state, info architecture mess |
| **MacroFactor** | 50% fewer taps than MFP, adaptive targets, fast quick-add (3 actions) | Power-user complexity for newbies |
| **MyFitnessPal** | Massive food DB | 15-action meal log, paywall everywhere, October 2025 update broke stability |
| **Lose It!** | Short onboarding, less cluttered | Limited Indian foods |
| **Strong** | Pre-fills last weights, auto rest timer, "less is more" screens | Hard paywall |
| **Hevy** | Cleaner layout, faster than Strong for newbies, free tier wins | Slightly busy with animations |

---

## 2. Core UX laws (non-negotiable)

1. **Time-to-first-log < 30 seconds** from cold app open. Cal AI: 3-second photo. Match it.
2. **Max 3 taps to log anything** from any screen. FAB → bottom sheet → confirm.
3. **One dominant CTA per screen.** No screen with 4+ equal-weight buttons.
4. **Bottom tabs ≤ 5 items.** NN/g rule. Touch targets 48dp min.
5. **Skippable onboarding fields.** Every "data ask" has a skip. Block nothing.
6. **Progress indicators on multi-step.** "2 of 4" — Baymard checkout principle.
7. **No empty states without action.** Empty meal log = "Add your first meal" with arrow to FAB.
8. **Loading states ≥ 200ms latency.** Skeleton screens, not spinners.
9. **Streak gamification visible on home.** Cult.fit pattern. Drives D1, D7, D30 retention.
10. **Indian-first defaults.** ₹ currency, kg weight, Asia/Kolkata TZ, Hindi food names visible.

---

## 3. Information architecture

### B2C client portal (member + individual)

```
🏠 Home          — single dominant view, calorie ring + meal timeline + workout card
🍽️ Food          — full calorie tracker, history, search
💪 Workouts      — workout tracker, history, routines
📈 Progress      — goals + analytics merged
👤 Me            — profile, subscription, settings
```

5 bottom tabs. Goals + Analytics merge under Progress.

### B2B admin portal (owner + trainer)

Sidebar (desktop-heavy use case justifies it):

```
Dashboard
Members
Trainers           (owner-only)
Plans              (owner-only)
Subscriptions      (owner-only)
Notifications      (owner-only)
Conversions        (owner-only)
```

### Master admin panel

```
Business metrics  | Org health | Product analytics | Support tools | System health | Growth
```

---

## 4. Screen-by-screen blueprint

### 4.1 Onboarding (B2C)

**Total: 4 micro-screens.** Progress indicator top.

```
┌──────────────────────────┐
│  Step 1 of 4 ━━──────────│
│                          │
│  What's your goal?       │
│                          │
│  [ Lose weight    ]      │
│  [ Gain muscle    ]      │
│  [ Build endurance]      │
│  [ Just track     ]      │
└──────────────────────────┘

┌──────────────────────────┐
│  Step 2 of 4 ━━━━━━──────│
│                          │
│  Quick stats             │
│  (helps personalize)     │
│                          │
│  Age            [   ] sk │
│  Height (cm)    [   ] sk │
│  Weight (kg)    [   ] sk │
│                          │
│  [ Continue ]            │
└──────────────────────────┘

┌──────────────────────────┐
│  Step 3 of 4 ━━━━━━━━━━──│
│                          │
│  Create account          │
│                          │
│  [📱 Phone OTP] (primary)│
│  ─── or ───              │
│  Email + password        │
└──────────────────────────┘

┌──────────────────────────┐
│  Step 4 of 4 ━━━━━━━━━━━━│
│                          │
│  ✓ All set!              │
│  30-day free trial active │
│                          │
│  [ Open Spacefit ]       │
└──────────────────────────┘
```

**Rules:**
- Goal first (Cal AI quiz pattern — psychological commitment)
- Stats 2nd, every field skippable individually
- Sign-in 3rd from end (Cal AI / Superwall data — reduces drop-off)
- Phone OTP primary for India (Cult.fit pattern)
- No paywall in MVP (we're free tier + premium upgrade later)

### 4.2 Onboarding (B2B gym owner)

```
Step 1 of 3 — Your gym (name, phone, address)
Step 2 of 3 — Owner account (name, email, password)
Step 3 of 3 — Done → Admin dashboard
```

3 steps. No skipping (this is paid SaaS, info matters).

### 4.3 Client home dashboard

```
┌──────────────────────────────────────┐
│  🔥 7-day streak    Hey Harshit  ⚙   │  ← greeting + streak chip
├──────────────────────────────────────┤
│                                      │
│           ⭕ CALORIE RING            │  ← Recharts PieChart
│            1240 / 2121               │   green→amber@80%→red@100%
│            881 kcal left             │
│                                      │
│         P 60g · C 180g · F 35g       │  ← 3 macros, equal weight
├──────────────────────────────────────┤
│  TODAY'S MEALS                       │
│  ☀️ Breakfast      380 kcal    + Add │  ← inline + on each row
│  🌤️ Lunch              —        + Add │
│  🍎 Snacks             —        + Add │
│  🌙 Dinner             —        + Add │
├──────────────────────────────────────┤
│  💪 TODAY'S WORKOUT                  │
│  No workout logged yet     [ Log + ] │
└──────────────────────────────────────┘

                              ┌─────┐
                              │  +  │  ← FAB, fixed bottom-right
                              └─────┘
```

**Rules:**
- Streak chip top-left (Cult.fit pattern). Hide if 0.
- Calorie ring = single dominant element. ~50% of viewport height on mobile.
- Macros below ring, equal-weight pills.
- Meal timeline = inline `+ Add` per row. No need to navigate to /food.
- Workout card separate, not buried.
- FAB always visible. Tap → bottom sheet (see 4.5).

### 4.4 Calorie tracker page (drill-down from Food tab)

Existing structure good. Keep:
- Date navigator (← Today →)
- Daily summary (ring + macros)
- 4 meal sections with logs

Add:
- Recent foods row at top of search dialog (already done in 5.1)
- Edit button on each entry (already done)

### 4.5 Quick-add bottom sheet (FAB)

```
┌──────────────────────────────────────┐
│  ────                                │  ← drag handle
│                                      │
│  Quick add                           │
│                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│  │  📷   │  │  🔍   │  │  ✨   │  │  💪   │
│  │Camera│  │Search│  │AI    │  │Work- │
│  │      │  │      │  │parse │  │out   │
│  └──────┘  └──────┘  └──────┘  └──────┘
│                                      │
│  RECENTLY EATEN                      │
│  • Roti (whole wheat)            +   │
│  • Dal tadka                     +   │
│  • Paneer                        +   │
│  • Chicken biryani               +   │
└──────────────────────────────────────┘
```

**Rules:**
- 4 primary modes: Camera (Phase 7+), Search, AI, Workout
- Recent foods = 1-tap quick-log (no dialog, just adds)
- Drag handle for dismissal
- 50-70% screen height

### 4.6 Calorie ring component spec

```
Recharts PieChart, 2 slices:
  - consumed / target (filled, color-coded)
  - target - consumed (empty / muted)

Center text:
  - Big number: consumed (e.g. 1240)
  - Subline: " / 2121 kcal"
  - Below: "881 kcal left" or "320 kcal over"

Color logic:
  - 0-80%: #10b981 (green)
  - 80-100%: #f59e0b (amber)
  - 100%+: #dc2626 (red)

Animation:
  - On mount: 600ms ease-out fill
  - On update: 300ms ease-out tween
```

### 4.7 Streak chip component spec

```
🔥 {N}-day streak

Logic:
  - Increment if user logged ≥1 thing yesterday
  - Reset to 0 if missed full day
  - Tracked: UserProfile.streakDays + UserProfile.streakLastDate

Visual:
  - Hide if streakDays = 0
  - Default: amber pill background, brown text
  - Milestone (7/30/100): bigger, with celebration icon
```

---

## 5. Visual system

### 5.1 Colors (semantic, OKLCH for perceptual uniformity)

```css
:root {
  /* Brand */
  --color-brand-primary: oklch(68% 0.18 250);    /* indigo */
  --color-brand-secondary: oklch(70% 0.15 160);  /* mint */

  /* Semantic */
  --color-success: oklch(70% 0.17 150);          /* green */
  --color-warning: oklch(78% 0.15 80);           /* amber */
  --color-danger: oklch(60% 0.22 25);            /* red */
  --color-info: oklch(70% 0.15 230);             /* blue */

  /* Surface */
  --color-bg: oklch(99% 0 0);                    /* near-white */
  --color-surface: oklch(100% 0 0);              /* white card */
  --color-surface-muted: oklch(97% 0 0);         /* gray-50 */
  --color-border: oklch(91% 0 0);                /* gray-200 */

  /* Text */
  --color-text: oklch(18% 0 0);                  /* near-black */
  --color-text-muted: oklch(50% 0 0);            /* gray-500 */
  --color-text-subtle: oklch(70% 0 0);           /* gray-400 */
}
```

### 5.2 Typography

```css
:root {
  /* Family */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Inter', system-ui, sans-serif;

  /* Scale (mobile-first, fluid) */
  --text-xs: clamp(0.75rem, 0.7rem + 0.1vw, 0.8125rem);
  --text-sm: clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem);
  --text-base: clamp(1rem, 0.95rem + 0.2vw, 1.0625rem);
  --text-lg: clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.3rem + 0.7vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem);
  --text-display: clamp(2.5rem, 2rem + 2vw, 4rem);  /* calorie number */
}
```

Pair: Inter for everything. Single family = fewer requests, faster LCP.

### 5.3 Spacing & radius

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;
}
```

### 5.4 Motion

Use compositor-friendly properties only (`transform`, `opacity`).

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

Page transitions: `--duration-normal` ease-out.
Micro-interactions: `--duration-fast`.
Hero reveal: `--duration-slow` ease-out-expo.

### 5.5 Elevation (subtle, mobile-friendly)

```css
:root {
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05);
  --shadow-fab: 0 4px 12px rgb(99 102 241 / 0.4);  /* brand-tinted */
}
```

---

## 6. Component patterns

### 6.1 Card

```
Padding: var(--space-5)
Border: 1px solid var(--color-border)
Radius: var(--radius-md)
Background: var(--color-surface)
Shadow: var(--shadow-sm)
```

Hover (desktop only): translate-y-[-2px], shadow-md, 150ms.

### 6.2 Button hierarchy

| Type | Use |
|------|-----|
| **Primary** | One per screen. Brand color background, white text. |
| **Secondary** | Outline, brand color text. |
| **Ghost** | No bg, no border. Icon-only nav, dismiss. |
| **Destructive** | Red bg. Confirm-modal required. |
| **FAB** | Fixed bottom-right, 56dp, brand bg, shadow-fab. |

### 6.3 Form input

```
Padding: 0.625rem
Border: 1px solid var(--color-border)
Radius: var(--radius-sm)
Focus: outline 2px solid var(--color-brand-primary), outline-offset 1px
Error: border-color var(--color-danger), error text below
```

### 6.4 Bottom sheet

```
Mobile only (<768px)
Slide up from bottom
Backdrop: rgba(0,0,0,0.4)
Border-radius top: 16px
Drag handle: 36×4px gray pill at top
Max height: 85vh
Body: overflow-y auto
```

Desktop equivalent: centered modal.

### 6.5 Empty state

Always actionable:
```
[icon]
[heading: what's missing]
[subtext: why it matters]
[primary CTA: how to fix]
```

Never dead-end.

---

## 7. Accessibility (WCAG 2.2 AA minimum)

- Color contrast ≥ 4.5:1 for text, 3:1 for large text/UI
- Touch targets ≥ 44x44px (iOS) / 48x48dp (Android)
- All interactive elements keyboard reachable
- Focus rings always visible (no `outline: none`)
- ARIA labels on icon-only buttons
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables all motion

---

## 8. Responsive breakpoints

```
< 640px   → mobile (default — design here first)
640-1024  → tablet (single-column → 2-column on cards)
> 1024    → desktop (sidebar nav, bottom tabs hidden)
> 1440    → wide (max-width container 1200px, centered)
```

Bottom tabs: visible <1024px. Sidebar: visible ≥1024px.

---

## 9. Performance budget

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TBT | < 200ms |
| JS bundle (initial) | < 150kb gzipped |
| CSS bundle | < 30kb |

Tactics:
- Code-split per route
- Defer Recharts to where needed
- Inline critical CSS (calorie ring + nav)
- Preload hero font weight only
- Compositor-only animations

---

## 10. Anti-patterns (banned)

- ❌ Default Tailwind/shadcn cards with no hierarchy
- ❌ Stock hero with centered headline + gradient blob
- ❌ "Sign up to see this" walls before showing value
- ❌ More than 5 bottom tabs
- ❌ Confirm dialogs for non-destructive actions
- ❌ Spinners > 200ms (use skeletons)
- ❌ Animating layout properties (width, height, top, left, margin, padding)
- ❌ Dead-end empty states
- ❌ Multi-paragraph error messages
- ❌ Tooltips as primary documentation
- ❌ "Coming soon" placeholders in production nav
- ❌ Long forms without progress indicators

---

## 11. India-first defaults

| Setting | Default |
|---------|---------|
| Currency | ₹ (INR) |
| Weight unit | kg |
| Height unit | cm |
| Distance unit | km |
| Date format | DD/MM/YYYY |
| Time zone | Asia/Kolkata |
| Phone format | +91 prefix |
| Language | English (Hindi/regional in Phase 9) |
| Calorie unit | kcal (not Cal) |
| Food DB | ICMR-NIN baseline + AI fallback for regional |

---

## 12. Streak rules

```
Day = 24h block in user's timezone (Asia/Kolkata default)

Increment streakDays if:
  - User logged ≥1 calorie OR ≥1 workout YESTERDAY (full day)
  - streakLastDate < today

Reset streakDays = 0 if:
  - More than 1 day passed since streakLastDate

Display:
  - Hide if streakDays = 0
  - Show 🔥 + N-day streak if > 0
  - Celebrate at 7, 14, 30, 60, 100 days (toast + animation)
```

---

## 13. Notification timing (drives retention)

Based on Cult.fit + HealthifyMe patterns:

| Channel | When | Content |
|---------|------|---------|
| WhatsApp | Member sub expiring 7/3/1 days | "Your gym membership expires in N days" |
| Push (PWA) | 11:30 AM if no breakfast logged | "Forget breakfast? Log it now" |
| Push | 7:30 PM if no dinner logged | "How was your day? Log dinner" |
| Push | 8 AM Sunday | Weekly summary (calories avg, workouts done) |
| Email | Streak milestone (7/30/100) | Celebration |

Limit: max 1 push/day. Don't be Cult.fit.

---

## 14. Success metrics (UX-tied)

| Metric | Target | Why |
|--------|--------|-----|
| Time-to-first-log | < 30s | Cal AI benchmark |
| Onboarding completion | > 70% | Industry: 50-60% |
| D1 retention | > 60% | Health/fitness avg: 30% |
| D7 retention | > 35% | Health/fitness avg: 14% |
| D30 retention | > 20% | Health/fitness avg: 5% |
| Daily logs per active user | > 2 | Engagement signal |
| Calorie ring viewed/day | > 3 | Home dwell time signal |
| FAB taps / total logs | > 50% | Quick-add adoption |

---

## 15. Sources

- [Cal AI Showcase](https://screensdesign.com/showcase/cal-ai-calorie-tracker)
- [Cal AI $35M Year 1](https://getlatka.com/blog/how-cal-ai-achieved-35-million-revenue-in-just-one-year/)
- [Cal AI paywall strategy — Superwall](https://superwall.com/case-studies/cal-ai)
- [HealthifyMe Wikipedia](https://en.wikipedia.org/wiki/HealthifyMe)
- [Cult.fit heuristic eval — Medium](https://medium.com/@charmy.hemant/cultfit-app-heuristic-evaluation-97431739bec3)
- [Cult.fit redesign case — Medium](https://medium.com/@armank.design/redesigning-cult-fit-a-ux-case-study-on-enhancing-the-home-workout-experience-94a9e0014270)
- [MacroFactor vs MFP 2026](https://macrofactor.com/macrofactor-vs-myfitnesspal-2025/)
- [Fastest food logger study — MacroFactor](https://macrofactorapp.com/fastest-food-logger/)
- [Strong vs Hevy 2026](https://gymgod.app/blog/strong-vs-hevy)
- [Hevy vs Strong fit — Setgraph](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026)
- [Onboarding best practices — SEM Nexus](https://semnexus.com/the-top-5-app-onboarding-best-practices-to-skyrocket-retention-in-2026/)
- [Health/Fitness paywall benchmarks — Adapty](https://adapty.io/blog/health-fitness-app-subscription-benchmarks/)
- [Bottom tab nav golden rules — Smashing](https://www.smashingmagazine.com/2016/11/the-golden-rules-of-mobile-navigation-design/)
- [NN/g mobile navigation patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/)

---

## 16. How to use this file

When using design skills:

```
/figma-generate-design  → reference §4 (screens) + §5 (visual system)
/frontend-design        → reference §6 (components) + §10 (anti-patterns)
/gan-design             → reference §2 (UX laws) + §14 (metrics) for evaluator rubric
```

When briefing humans: send §2, §3, §4, §10. Skip rest unless asked.

When code reviewing: check against §10 (anti-patterns) + §7 (a11y) + §9 (perf).
