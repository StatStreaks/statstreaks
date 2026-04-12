# StatStreaks — Project Context & Claude Instructions

## What is StatStreaks?
A football higher-or-lower guessing game built as a **single-file React JSX app** (`App.jsx`). Players see a footballer's stat and guess whether the next player's stat is higher or lower. There are two modes: **Daily Streak** (one match per day, builds career caps) and **Training Pitch / Rush** (30-second high-score mode, 8 categories).

---

## Working File
- **Main file:** `App.jsx` (single file, ~3,830 lines)
- **Always copy the user's latest uploaded `App.jsx` to `/home/claude/App.jsx` before editing**
- **Output always goes to `/mnt/user-data/outputs/App.jsx`**
- **Never rebuild from scratch — always edit the existing file**

---

## Architecture Overview

```
PhoneShell (desktop phone frame wrapper, injects favicon via useEffect)
  └── AppWithAuth (password gate — password: "bottlers")
        └── App (main game logic)
              ├── screen === "home"       → Home screen
              ├── screen === "rush"       → RushPage (standalone function)
              ├── screen === "leaderboard"→ LeaderboardScreen (standalone function)
              ├── screen === "terms"      → TermsScreen
              ├── screen === "game"       → Game screen (daily + rush)
              └── screen === "result"     → Result screen
```

### Key standalone functions (defined OUTSIDE App)
- `LeaderboardScreen({onBack, rushScores, username, streak, defaultTab, rushBestCat, onSetUsername})`
- `RushPage({onBack, onPlay, onLeaderboard, onHowToPlay, username, streak, onSetUsername})`
- `TermsScreen({onBack})`
- `PhoneShell()` — default export, wraps everything
- `AppWithAuth()` — password gate

### Key functions defined INSIDE App
- `getStreakSubtext()` — uses `streak` from closure + `CAPS_PLAYERS` + `EARLY_MESSAGES`
- `HowToPlayOverlay()` — inline component
- `RushModal()` — inline component for continue/retry after wrong answer

---

## Screens & Navigation
| `screen` value | What renders | Back destination |
|---|---|---|
| `"home"` | Home screen | — |
| `"rush"` | RushPage | → home |
| `"leaderboard"` | LeaderboardScreen | → `prevScreen` (home or rush) |
| `"terms"` | TermsScreen | → home |
| `"game"` | Game screen | → home (daily) or rush (rush mode) |
| `"result"` | Result screen | → home (daily) or rush (rush mode) |

---

## Data Structures

### RUSH_CATEGORIES (line ~66)
8 active categories + 5 coming soon:
- `pl_goals` — Premier League Goals (blue, ~160 cards)
- `pl_assists` — Premier League Assists (cyan, ~115 cards)
- `pl_appearances` — Premier League Appearances (teal, ~150 cards)
- `intl_caps` — International Caps (pink, ~160 cards)
- `intl_goals` — International Goals (blue, ~130 cards)
- `transfer_fees`, `la_liga_goals`, `ucl_goals`, `mufc_goals`, `lfc_goals` — coming soon

Each card: `{player, stat, statType, club|nationality}`

### DAILY_CHALLENGES (line ~921)
10 daily challenges (days 1–10, loops). Each has `{day, theme, cards[11]}`.

### CAPS_PLAYERS (line ~2757, inside App)
Array of `{caps, name, country, msg}` — used by `getStreakSubtext()` to show player comparisons on the caps card. Notable entries:
- caps:13 → Darren Bent
- caps:18 → Carlton Palmer
- caps:23 → Wes Brown
- caps:33 → Ian Wright
- caps:37 → George Best (N. Ireland)
- caps:43 → Martin Keown
- caps:45 → Eric Cantona (France)
- caps:48 → Marco Reus (Germany)
- caps:69 → Nicolas Anelka (France) ← added, was gap between 68 and 70
- caps:72 → Michel Platini (France) ← was Uwe Seeler
- caps:180 → Sergio Ramos (max)

### EARLY_MESSAGES (line ~2905, inside App)
Array of 10 strings (index 0–9). Index 0 = "Play today's match to get on the board".
Indexes 1–9 use the new 3-line `\n`-delimited format:
```
"You've reached Joey Barton\nOne cap for England...\nGet beyond Barton. Next cap tomorrow 🔥"
```

---

## Caps Card — Shareable Format

`getStreakSubtext()` returns a `\n`-delimited 3-line string for caps 10+ and EARLY_MESSAGES 1–9:
- **Line 1** (bold white): `"You've reached Andy Cole"` or `"You've passed Andy Cole"`
- **Line 2** (italic dim): The player's description
- **Line 3** (coloured CTA): `"Go beyond Cole. Next cap tomorrow 🔥"`

The caps card renderer splits on `\n` and styles each line distinctly. Falls back to single italic line for gap messages (no player match).

This same 3-line renderer is used in:
1. Home screen caps hero card (`screen === "home"`)
2. Daily result screen caps card (`screen === "result"`, daily mode)

---

## localStorage Keys (all prefixed `ss_`)
| Key | Value | Notes |
|---|---|---|
| `ss_unlocked` | bool | Password gate |
| `ss_streak` | int | Career caps (daily streak) |
| `ss_peak_streak` | int | Highest ever streak |
| `ss_daily_done` | `"YYYY-M-D"` | Today's key if played |
| `ss_daily_result` | `{key, dots[]}` | Today's answer log |
| `ss_last_played` | `"YYYY-M-D"` | For restore/decay logic |
| `ss_restore_offered` | bool | Whether restore was shown |
| `ss_decay_start` | `"YYYY-M-D"` | When decay began |
| `ss_last_decay_applied` | `"YYYY-M-D"` | Prevents double-decay |
| `ss_rush_scores` | int[] | Global rush score history (last 50) |
| `ss_rush_best_{catId}` | int | All-time best per category |
| `ss_rush_weekly_{catId}_{weekKey}` | int | Weekly best per category |
| `ss_rush_plays_{catId}` | int | Play count per category |
| `ss_username` | string | Display name |
| `ss_user_id` | uuid | Anonymous leaderboard ID |
| `ss_htp_seen` | bool | How To Play overlay seen |

---

## Score Save Logic (saveRushScore)
Fixed bug where weekly could exceed all-time. Current logic:
```js
const newWeekly = Math.max(prevWeekly, s);
if(newWeekly > prevWeekly) lsSet(weeklyKey, newWeekly);
const newAllTime = Math.max(prev, s, newWeekly);  // always >= weekly
if(newAllTime > prev) lsSet(`rush_best_${cat}`, newAllTime);
```

---

## Rush Difficulty
`rushShuffle()` uses `MAX_RATIO = 0.35` (was 0.50). Lower ratio = wider gaps allowed through = easier pairs. Pairs where `smaller/larger < 0.35` are swapped out if possible.

---

## Career Caps System
Daily play earns +1 cap. Career status tiers in `getCareerStatus(caps)`:
- 0 = Uncapped, 1–3 = Academy Prospect, 4–7 = Youth Team, 8–14 = Squad Player
- 15–24 = Rotation Option, 25–39 = First Team Regular, 40–59 = Key Player
- 60–84 = Star Player, 85–114 = International, 115–149 = World Class
- 150–199 = All-Time Great, 200+ = Hall of Fame

### Restore/Decay System
- Miss 1 day: no penalty (might not have played yet today)
- Miss 2+ days: show **Restore overlay** (watch ad = keep streak, decline = start decay)
- Decay: -1 cap per day until they play again or accept boost
- Boost: +3 caps, capped at peak streak

---

## Leaderboard
Three tabs:
- **Top Scorer** (weekly) — best Training Pitch score this ISO week
- **Golden Boot** (all-time) — best Training Pitch score ever
- **Caps** (all-time) — current career caps streak

Boards are simulated with `SIM_NAMES` + `seededVal()`. Live data requires Supabase.

**Name editing** is available on three screens:
1. Home screen (inline in caps card, top-right)
2. Leaderboard header (top-right, `onSetUsername` prop)
3. Training Pitch / Rush header (top-right, `onSetUsername` prop)

All three sync to `ss_username` via `setUsername(n)`.

---

## Logo & Favicon

### Homepage Logo (line ~3076)
```jsx
<img src="data:image/png;base64,..." alt="StatStreaks"
  style={{width:"100%",maxWidth:340,height:"auto",display:"block",margin:"0 auto"}}/>
```
- Uses `Final_SS_Logo_White.png` with background removed (white text on transparent)
- No `borderRadius` — blends into dark background
- The original PNG was RGB (no alpha) — background was removed by converting brightness to alpha

### Favicon (PhoneShell, line ~2222)
```jsx
useEffect(()=>{
  const existing = document.querySelector("link[rel='icon']");
  if(existing) existing.remove();
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = "data:image/png;base64,..."; // Final_SS_Favi_Colour.png
  document.head.appendChild(link);
},[]);
```

---

## Game Modes Detail

### Daily Mode
- 11 cards, 10 guesses (smartOrder shuffles for good spread)
- 1 Yellow Card allowed (watch ad to continue after 1 wrong)
- Wrong answer without yellow = Red Card → result screen
- Completes daily: +1 cap, resets restore/decay flags

### Rush / Training Pitch Mode
- 30-second timer, unlimited cards, keep going until time runs out
- Wrong answer behaviour:
  - `timeLeft > 20` OR `continueCount > 0`: loose touch, flash and continue (no modal)
  - `timeLeft ≤ 20` AND `continueCount === 0`: show Rush Modal (continue/retry)
- Perfect run (no continues): score × 2
- `cleanScore` tracks score before first continue
- Score saved on: timeout, rushDismiss, or rushRetry

### Countdown Overlay
Both modes show 3-2-1 countdown before cards appear. `countdown` state: `0` = question preview, `3/2/1` = numbers, `null` = game live.

---

## Design System

### Colour Palette (dark theme)
```
bg:         #0f1923   (deep navy)
bgCard:     #ffffff   (white cards)
bgSurface:  #1a2535   (elevated surface)
green:      #16a34a   (primary action)
amber:      #d97706   (caps/gold)
blue:       #2563eb   (rush/training)
cyan:       #06b6d4   (This Week scores)
pink:       #ec4899   (All-Time scores / Rush page accent)
```

### Fonts
- **Bebas Neue** — headings, big numbers, brand name
- **Inter** — body, labels, UI
- **Oswald** — stat panels (player names, numbers)

### Phone Shell (desktop only, ≥700px)
Renders as iPhone-like frame (390px wide, 50px border-radius, fake notch).
`.ss-shell-inner` has `padding-top: 34px` to clear the notch.
Mobile (≤699px): shell is transparent (`display: contents`).

### Stat Panel Card
`StatPanel` component renders both the "revealed" (current) and "hidden" (next) cards.
- 158px wide, white background, colour-coded top accent bar
- Flashes: correct=cyan, wrong=red, yellow=amber
- Auto-scales player name font: 10–13px based on name length

---

## Key Behaviour Notes

### Demo Controls (home screen, bottom)
Row of 5 small dashed buttons for testing:
- 🔄 Cycle day (1–10)
- 🧢 +1 Cap
- 💤 Miss Day (triggers restore overlay)
- 📉 Decay (-1 cap)
- 🗑 Reset all data

### How To Play Overlay
Shows on first visit (checks `ss_htp_seen`). 3-step carousel. Also accessible via "How to play" button on home, game, and rush screens.

### Interstitial Ad Overlay
Shows before results screen (demo only). 4-second countdown then auto-dismisses. Skipped if yellow card ad was already watched.

### Rush Modal (continue/retry)
Shows when player gets wrong answer in ≤20s with no previous continue:
- "Win It Back" (continue, reshuffle remaining cards, same time)
- "Back to Training" (retry, fresh cards, full 30s)
- "End Training Session" (go to results)

---

## Common Edit Tasks & Where to Find Things

| Task | Location |
|---|---|
| Add/edit daily challenge | `DAILY_CHALLENGES` array, line ~921 |
| Add/edit rush category cards | `RUSH_CATEGORIES` array, line ~66 |
| Add/edit caps player comparison | `CAPS_PLAYERS` array, line ~2757 |
| Edit early messages (caps 1–9) | `EARLY_MESSAGES` array, line ~2905 |
| Change rush difficulty | `MAX_RATIO` in `rushShuffle()`, line ~1016 |
| Change password | `PASSWORD` const, line ~2121 |
| Edit home screen layout | `screen === "home"` branch, line ~3039 |
| Edit result screen | `screen === "result"` branch, line ~3390 |
| Edit game screen | bottom of App(), line ~3590 |
| Edit caps card (home) | returning user block inside caps hero, line ~3183 |
| Edit caps card (result) | inside result screen daily section, line ~3488 |
| Edit leaderboard header | `LeaderboardScreen` function, line ~1075 |
| Edit rush/training page | `RushPage` function, line ~1839 |
| Swap logo image | `img src` in home screen header, line ~3076 |
| Edit favicon | `useEffect` in `PhoneShell`, line ~2222 |
| Edit phone shell CSS | `PhoneShell` style block, line ~2233 |

---

## Instructions for Claude

1. **Always work from the uploaded file.** Copy `/mnt/user-data/uploads/App.jsx` to `/home/claude/App.jsx` first.

2. **Never rebuild the file.** Make targeted `str_replace` edits or Python string replacements only.

3. **Single file.** Everything lives in one JSX file — no separate CSS, no separate components.

4. **Check before editing.** Use `grep -n` to find exact line numbers and verify content before replacing.

5. **Base64 images.** Logo and favicon are embedded as base64 data URIs. To swap an image:
   - Read the new PNG with Python, `base64.b64encode(open(...,'rb').read()).decode()`
   - Use `re.sub()` or Python string replacement (not `str_replace` tool — too long for tool)
   - For logo background removal: convert to RGBA, use brightness as alpha, set RGB to white

6. **Caps card 3-line format.** `getStreakSubtext()` returns `\n`-delimited strings. The renderer splits on `\n` and styles line 1 bold white, line 2 italic dim, line 3 coloured. Both home and result screen caps cards use this renderer.

7. **EARLY_MESSAGES format** (caps 1–9) must match the 3-line `\n` format:
   ```
   "You've reached [Full Name]\n[Description sentence.]\nGo beyond [Surname]. Next cap tomorrow 🔥"
   ```

8. **CAPS_PLAYERS msgs** should be 1–2 sentences, no head-exploding emoji (🤯 removed).

9. **Name editing** — `onSetUsername` prop is passed to both `LeaderboardScreen` and `RushPage`. The home screen uses local `nameEditing`/`nameDraft` state + `setUsername()` directly.

10. **Rush score save** — `saveRushScore(s, isClean)` — all-time is always `Math.max(prev, s, newWeekly)`. Never let weekly exceed all-time.

11. **Output.** Always copy final file to `/mnt/user-data/outputs/App.jsx` and use `present_files`.

12. **Contact:** statstreaks@gmail.com