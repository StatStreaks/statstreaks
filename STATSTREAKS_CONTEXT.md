# StatStreaks — Project Context & Claude Instructions

## What is StatStreaks?
A football higher-or-lower guessing game. Two modes: **Daily** (one challenge per day, builds career caps) and **Rush Mode** (30-second high-score, multiple categories, aggregate leaderboard).

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
- `InterstitialOverlay` — line ~1183 (component exists but is never rendered — see Ads section)
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

### RUSH_CATEGORIES (line ~275)

**Active categories** (no `comingSoon` flag — all live and playable):
- `pl_goals` — Premier League Goals
- `pl_assists` — Premier League Assists
- `pl_appearances` — Premier League Appearances
- `intl_caps` — International Caps
- `intl_goals` — International Goals
- `womens_int_caps` — Women's Int'l Caps
- `arsenal_spurs_goals` — Arsenal vs Spurs Goals
- `ucl_goals` — UCL Goals
- `combined_goals` — Man Utd & Liverpool Goals
- `england_caps` — England Caps

**Coming soon** (`comingSoon: true`, hidden from play):
- `transfer_fees` — Transfer Fees
- `la_liga_goals` — La Liga Goals

> Note: `mufc_goals` and `lfc_goals` have been removed and replaced by `combined_goals`.

Rush card cache key: `rc_cards_v2_{catId}` (bump version to force re-fetch)

---

### DAILY_CHALLENGES (line ~307)
30 daily challenges, displayed in **stat-first format** e.g. `"Premier League Goals · English Icons"`. Displayed in **seeded random order** — same challenge for everyone on the same day, order randomised by year + cycle seed.

Current 30 challenges:
1–13: Premier League Goals · [English / French / Belgian / German / Spanish / Dutch / Portuguese / Argentinian / Brazilian / African / Italian / Irish / Welsh] Icons
14: FA Cup Winners
15: Champions League Winners
16: World Cup Winners
17: Premier League Assists · British Icons
18: Premier League Assists · Global Icons
19: Premier League Appearances · British Icons
20: Premier League Appearances · Global Icons
21–23: International Caps · Global Icons
24–26: International Goals · Global Icons
27: Golden Boot · Modern Era
28: Golden Boot · Classic Era
29: Ground Capacity · Premier League
30: Ground Capacity · Europe

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
- Wrong 2 → Red card → results (no interstitial)
- Correct completion → +1 cap

### Rush Mode
- 30-second timer (starts AFTER 3-2-1 countdown completes)
- Wrong 1 → "Lost Possession" modal → "Keep Going ⚡" → resume, timer continues, continueCount=1
- Wrong 2 → session over → results (no interstitial)
- No grace period / loose touch mechanic
- Perfect run (no mistakes, timeout): score × 2
- PB indicator shown during game (best of alltime/weekly)
- Score saves on: timeout, second wrong, "End Session" button in Lost Possession modal

### Sound timing
Sounds fire **directly before `setScreen("result")`** in three places:
- `endRushRun("timeout")` — newBest / noBest / timeout sound
- `endRushRun("wrong")` second wrong path — same logic
- "End Session" button in `RushModal` — same logic
- Daily win: `SFX.win()` fires in `finishGame()` before `setScreen("result")`

No sounds fire in interstitial `onDismiss` — interstitial is bypassed entirely.

---

## Ads
**Ads are currently hidden while building user base.**
- `AdBanner` component returns `null` — all three ad placements (home, daily result, rush result) render nothing
- `InterstitialOverlay` component still exists in code but `showInterstitial` is **never set to `true`**
- All three interstitial trigger points now go directly to results with sound
- `showRestoreInterstitial` is also bypassed — boost/restore applies immediately on `onWatch()`
- **Do not re-introduce `setShowInterstitial(true)` calls without discussion**
- Re-enable by: making `AdBanner` return its JSX, and restoring `setShowInterstitial(true)` in `endRushRun` + "End Session" button

---

## Leaderboards
Three tabs:
- **Top Scorer** (weekly) — aggregate Rush score across all active categories this week
- **Golden Boot** (all-time 2026) — aggregate Rush score across all active categories
- **Caps** — career caps streak, filters `caps > 0`

Each row shows `X/N categories` as subtitle (N = active category count, excludes `comingSoon`).
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
- Restore/boost applies immediately — no interstitial gate

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
6. Dev panel (hidden until logo tapped 7× + correct password)

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
- ⚡ Play Again — Rush Mode button
- AdBanner (currently renders nothing)
- Share + Leaderboards buttons

---

## Dev Mode
- Tap logo 7× within 2s → password prompt appears
- Password: `bottlers`
- Wrong password silently resets tap count
- Dev panel buttons: 🔄 Day / 🧢 +1 Cap / 💤 Miss Day / 📉 Decay / 🗑 Reset

---

## SEO / Deployment
- **Live at:** statstreaks.com (Vercel, Vite/React)
- `public/ads.txt` — `google.com, pub-8717231673861805, DIRECT, f08c47fec0942fa0`
- `public/robots.txt` — allows all, references sitemap
- `public/og-image.png` — 1200×630 banner
- `public/favicon.png` — logo icon
- `index.html` — full meta tags, OG tags, structured data (WebApplication schema)
- ~~AdSense~~ ❌ Application rejected (single page / no traffic). Ads hidden. Re-apply when user base grows.
- Google Search Console — indexed ✅

---

## Common Edit Tasks

| Task | Location |
|---|---|
| Add/edit daily challenge | `daily_challenges` DB table + `daily_cards` |
| Add/edit rush cards | `rush_cards` DB table, bump cache key `rc_cards_v2_` |
| Add/edit caps player comparison | `caps_players` DB table |
| Change rush difficulty | `MAX_RATIO` in `rushShuffle()` |
| Re-enable ads | `AdBanner` return JSX; restore `setShowInterstitial(true)` in `endRushRun` + End Session button |
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
- **La Liga Goals + Transfer Fees** — data not ready, marked `comingSoon`
- **ICO registration** — £40, before wider marketing
- **Share image** — Wordle-style result card
- **Push notifications** — parked until larger user base
- **TikTok content** — card designer built (HTML tool), hooks/CTAs defined, filming in progress
- ~~**PWA**~~ ✅ Done — manifest, service worker, install banner live
- ~~**Rewarded ads**~~ ❌ Removed — not available on AdSense
- ~~**AdSense**~~ ❌ Rejected — ads hidden, re-apply when traffic grows

---

## Instructions for Claude

1. **Always work from the uploaded file.** Copy `/mnt/user-data/uploads/App.jsx` to `/home/claude/App.jsx` first.
2. **Never rebuild.** Targeted `str_replace` or Python string replacements only.
3. **Single file.** Everything in one JSX file.
4. **Check before editing.** Use `grep -n` to verify exact content before replacing.
5. **Base64 images.** Logo and favicon embedded as base64 data URIs. Use Python `re.sub()` to swap.
6. **Caps card 3-line format.** `getStreakSubtext()` returns `\n`-delimited strings. Both home and result caps cards use this renderer.
7. **Rush score save.** `saveRushScore(s, isClean)` — alltime always `Math.max(prev, s, newWeekly)`.
8. **Sound timing.** Sounds fire directly before `setScreen("result")` in `endRushRun()` and `finishGame()`. No interstitial. Never add `useEffect` inside conditional screen blocks.
9. **Ghost row prevention.** `dbSyncUser` only fires if `caps > 0` or `username` is set.
10. **Ads hidden.** Do not restore `setShowInterstitial(true)` without discussion. `AdBanner` returns `null`.
11. **Dev password.** Dev mode requires password `"bottlers"` after 7 logo taps.
12. **Daily challenge format.** Themes are stat-first: `"Premier League Goals · English Icons"` not `"English Icons · Premier League Goals"`.
13. **Output.** Always copy final file to `/mnt/user-data/outputs/App.jsx` and use `present_files`.
14. **Contact:** statstreaks@gmail.com