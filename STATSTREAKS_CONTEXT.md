# StatStreaks — Project Context & Claude Instructions

## What is StatStreaks?
A football higher-or-lower guessing game. Two modes: **Daily** (one match per day, builds career caps) and **Rush Mode** (30-second high-score, 8 categories, aggregate leaderboard).

---

## Working File
- **Main file:** `App.jsx` (single file, ~3,900 lines)
- **Always copy the user's latest uploaded `App.jsx` to `/home/claude/App.jsx` before editing**
- **Output always goes to `/mnt/user-data/outputs/App.jsx`**
- **Never rebuild from scratch — always edit the existing file**

---

## Architecture

```
PhoneShell (desktop phone frame, injects favicon)
  └── App (main game logic — no password gate)
        ├── screen === "home"        → Home screen
        ├── screen === "rush"        → RushPage (standalone function)
        ├── screen === "leaderboard" → LeaderboardScreen (standalone function)
        ├── screen === "terms"       → TermsScreen
        ├── screen === "game"        → Game screen (daily + rush)
        └── screen === "result"      → Result screen
```

### Key standalone functions (OUTSIDE App)
- `LeaderboardScreen` — line ~427
- `RushPage` — line ~1379
- `TermsScreen` — line ~1590
- `InterstitialOverlay` — line ~1183
- `getRushMessage(score, catBest, globalBest)` — line ~1283
- `getCareerStatus(caps)` — line ~1364
- `getCardContext(card, catId)` — line ~843
- `StatPanel` — line ~950
- `PhoneShell` — line ~1684 (default export)

### Key functions INSIDE App
- `getStreakSubtext()` — uses DB caps players
- `HowToPlayOverlay()` — inline component (4 steps including Rush Mode)
- `RushModal()` — Lost Possession popup (inline)
- `launchDaily()` — line ~1978
- `launchRush(cat)` — line ~2025
- `endRushRun(reason)` — line ~2059
- `rushDismiss()` — closes modal, increments continueCount, resumes game

---

## Supabase

**URL:** `https://lqxcrzpqsdqonvrifpei.supabase.co`

### Tables
| Table | Key columns |
|---|---|
| `users` | device_id, username, caps, peak_caps |
| `daily_scores` | device_id, day_key, score, username |
| `rush_bests` | device_id, category, username, alltime_best, weekly_best, week_key |
| `daily_challenges` | day, theme, competition, stat_type |
| `daily_cards` | day, position, player, stat, stat_type, club, nationality |
| `rush_cards` | category, player, stat, stat_type, nationality, club |
| `caps_players` | id (0=no caps, 1-9=early msgs, 10+=comparison), name, country, msg |

### Views
| View | Purpose |
|---|---|
| `rush_alltime_aggregate` | SUM(alltime_best) per player across all categories |
| `rush_weekly_aggregate` | SUM(weekly_best) per player per week_key |
| `rush_alltime_best` | DISTINCT ON device_id, best single-category score |
| `rush_weekly_best` | DISTINCT ON device_id, best weekly single-category score |

### RPC
- `get_rush_ranks(p_device_id, p_week_key)` — returns alltime_rank + weekly_rank per category

### Key DB functions (line ~79)
- `dbSyncUser()` — upsert user row, only fires if caps>0 or username set (prevents ghost rows)
- `dbFetchAllTime()` — fetches from `rush_alltime_aggregate`
- `dbFetchWeekly(weekKey)` — fetches from `rush_weekly_aggregate`
- `dbFetchCaps()` — filters `caps > 0`
- `dbFetchRushRanks(deviceId, weekKey)` — RPC call
- `saveRushScore(s, isClean)` — best-wins logic, alltime always >= weekly

---

## Data Structures

### RUSH_CATEGORIES (line ~272)
8 active categories + coming soon:
- `pl_goals` — Premier League Goals (163 cards, corrected April 2026)
- `pl_assists` — Premier League Assists (150 cards, corrected April 2026)
- `pl_appearances` — Premier League Appearances
- `intl_caps` — International Caps
- `intl_goals` — International Goals
- `mufc_goals` — Man Utd Goals
- `lfc_goals` — Liverpool Goals
- `ucl_goals` — Champions League Goals
- Coming soon: `transfer_fees`, `la_liga_goals`

Rush card cache key: `rc_cards_v2_{catId}` (bump version to force re-fetch)

### DAILY_CHALLENGES (line ~299)
30 daily challenges in DB (`daily_challenges` table). Displayed in **seeded random order** — same challenge for everyone on the same day, order randomised by year + cycle seed.

---

## Daily Challenge Order (seededShuffle)
```js
function seededShuffle(arr, seed) // line ~56
// Seed = year*1000 + Math.floor(rawDayIdx/totalDays)
// Changes each year and each full cycle of 30
```
`todayChallenge` and `tomorrowChallenge` both use `shuffledChallenges[]`.

---

## Game Modes

### Daily Mode
- 11 cards, 10 guesses
- Wrong 1 → Yellow card popup (free, no ad)
- Wrong 2 → Red card → interstitial → results
- Correct completion → +1 cap

### Rush Mode
- 30-second timer (starts AFTER 3-2-1 countdown completes)
- Wrong 1 → "Lost Possession" modal → "Keep Going ⚡" → resume, timer continues, continueCount=1
- Wrong 2 → session over → interstitial → results
- No grace period / loose touch mechanic
- Perfect run (no mistakes, timeout): score × 2
- PB indicator shown during game (best of alltime/weekly)
- Score saves on: timeout, second wrong, rushDismiss→second wrong

### Sound timing
Sound fires in interstitial `onDismiss` (after ad, before results screen) — NOT before interstitial.

---

## Leaderboards
Three tabs:
- **Top Scorer** (weekly) — aggregate Rush score across all 8 categories this week
- **Golden Boot** (all-time 2026) — aggregate Rush score across all 8 categories
- **Caps** — career caps streak, filters `caps > 0`

Each row shows `X/8 categories` as subtitle.
Deduplication by username — highest score wins if same name appears twice.
Auto-names get 4-digit suffix e.g. "NutmegNorman #4271".

Rush result screen shows global rank (`World #N` and `#N this week`) per category.

---

## Career Caps System
Daily play = +1 cap. `getCareerStatus(caps)` tiers:
0=Uncapped, 1-3=Academy Prospect, 4-7=Youth Team, 8-14=Squad Player,
15-24=Rotation Option, 25-39=First Team Regular, 40-59=Key Player,
60-84=Star Player, 85-114=International, 115-149=World Class,
150-199=All-Time Great, 200+=Hall of Fame

### Caps card — 3-line format
`getStreakSubtext()` returns `\n`-delimited string:
- Line 1 (bold white): "You've reached Andy Cole"
- Line 2 (italic dim): player description
- Line 3 (coloured CTA): "Go beyond Cole. Next cap tomorrow 🔥"

### Restore/Decay
- Miss 1 day: no penalty
- Miss 2+ days: Restore overlay (decline = decay)
- Decay: -1 cap/day until play again
- Boost: +3 caps, capped at peak

---

## localStorage Keys (all prefixed `ss_`)
| Key | Value |
|---|---|
| `ss_streak` | Career caps |
| `ss_peak_streak` | All-time peak |
| `ss_daily_done` | `"YYYY-M-D"` if played today |
| `ss_daily_result` | `{key, dots[]}` |
| `ss_last_played` | `"YYYY-M-D"` |
| `ss_restore_offered` | bool |
| `ss_decay_start` | `"YYYY-M-D"` |
| `ss_rush_scores` | int[] last 50 |
| `ss_rush_best_{catId}` | All-time best per category |
| `ss_rush_weekly_{catId}_{weekKey}` | Weekly best per category |
| `ss_rush_plays_{catId}` | Play count |
| `ss_username` | Display name |
| `ss_user_id` | Anonymous UUID |
| `ss_htp_seen` | How To Play seen |
| `ss_dev_mode` | Dev panel enabled |

---

## Home Screen Layout (screen === "home", line ~2566)
1. Logo + How to play
2. Today's Match card (plays today / shows score+share if played)
3. ⚡ Play Rush — full width primary CTA (pink)
4. 🏆 Leaderboards — full width secondary (amber)
5. Career Caps hero card
6. Dev panel (hidden until logo tapped 7×)

---

## Result Screen (screen === "result", line ~2946)

### Daily result
- Score dots, YOUR SCORE / GLOBAL AVG grid
- Share on WhatsApp button
- Tomorrow's Match
- ⚡ Rush Mode CTA: "Now See If You Can Top the Rush Leaderboard"
- Career caps card

### Rush result
- Score card: SCORE + PERSONAL BEST + global rank (World #N / #N this week)
- Message from `getRushMessage(score, catBest, globalBest)`
- Career caps band
- ⚡ Play Again — Rush Mode button (ABOVE ad)
- AdBanner
- Share + Leaderboards buttons

---

## Dev Mode
- Tap logo 7× within 2s → toggles dev mode (stored `ss_dev_mode`)
- Dev panel buttons: 🔄 Day / 🧢 +1 Cap / 💤 Miss Day / 📉 Decay / 🗑 Reset

---

## SEO / Deployment
- **Live at:** statstreaks.com (Vercel, Vite/React)
- `public/ads.txt` — `google.com, pub-8717231673861805, DIRECT, f08c47fec0942fa0`
- `public/robots.txt` — allows all, references sitemap
- `public/og-image.png` — 1200×630 banner
- `public/favicon.png` — logo icon
- `index.html` — full meta tags, OG tags, structured data (WebApplication schema)
- AdSense applied, "Getting ready" status
- Google Search Console — indexed ✅

---

## Common Edit Tasks

| Task | Location |
|---|---|
| Add/edit daily challenge | `daily_challenges` DB table + `daily_cards` |
| Add/edit rush cards | `rush_cards` DB table, bump cache key `rc_cards_v2_` |
| Add/edit caps player comparison | `caps_players` DB table |
| Change rush difficulty | `MAX_RATIO` in `rushShuffle()` |
| Edit home screen | `screen === "home"` branch, line ~2566 |
| Edit result screen | `screen === "result"` branch, line ~2946 |
| Edit game screen | bottom of App(), line ~3580 |
| Edit leaderboard | `LeaderboardScreen` function, line ~427 |
| Edit rush page | `RushPage` function, line ~1379 |
| Edit How To Play | `HowToPlayOverlay` inside App, line ~2510 |
| Edit rush messages | `getRushMessage()`, line ~1283 |
| Swap logo image | `img src` in home screen header |
| Edit favicon | `useEffect` in `PhoneShell`, line ~1700 |

---

## Pending / Next Session
- **More daily challenges** — 30 days loops after a month, need more variety
- **Stats validation** — check all rush card data for errors
- **La Liga Goals + Transfer Fees** — data not ready
- **ICO registration** — £40, before wider marketing
- **Share image** — Wordle-style result card
- **Push notifications** — parked until larger user base
- ~~**PWA**~~ ✅ Done — manifest, service worker, install banner live
- ~~**Rewarded ads**~~ ❌ Removed — not available on AdSense. Ad strategy is static banners (AdBanner component) + interstitials only. No rewarded/continue mechanic planned.

---

## Instructions for Claude

1. **Always work from the uploaded file.** Copy `/mnt/user-data/uploads/App.jsx` to `/home/claude/App.jsx` first.
2. **Never rebuild.** Targeted `str_replace` or Python string replacements only.
3. **Single file.** Everything in one JSX file.
4. **Check before editing.** Use `grep -n` to verify exact content before replacing.
5. **Base64 images.** Logo and favicon embedded as base64 data URIs. Use Python `re.sub()` to swap.
6. **Caps card 3-line format.** `getStreakSubtext()` returns `\n`-delimited strings. Both home and result caps cards use this renderer.
7. **Rush score save.** `saveRushScore(s, isClean)` — alltime always `Math.max(prev, s, newWeekly)`.
8. **Sound timing.** Sounds fire in interstitial `onDismiss`, never before it. No `useEffect` inside conditional screen blocks.
9. **Ghost row prevention.** `dbSyncUser` only fires if `caps > 0` or `username` is set.
10. **Output.** Always copy final file to `/mnt/user-data/outputs/App.jsx` and use `present_files`.
11. **Contact:** statstreaks@gmail.com