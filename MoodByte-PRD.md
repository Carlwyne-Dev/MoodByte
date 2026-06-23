# MoodByte — Product Requirements Document (Rebuild)

**Owner:** Carlwyne R. Maghari
**Status:** Planning
**Version:** 1.0 — rebuild of original vanilla JS app into React

---

## 1. Overview

MoodByte is a personal digital wellness app combining mood tracking, productivity tools, and ambient music into one space. This is a ground-up rebuild of the original vanilla HTML/CSS/JS project (`Carlwyne-Dev/moodbyte`) using React, reusing the original as a feature/UX reference rather than porting code directly.

**Goals of the rebuild:**
- Replace global-script spaghetti (`main.js`, `mood.js`, `music.js`, etc. all touching shared DOM/localStorage) with isolated, composable React components.
- Keep all existing functionality and visual identity (themes, mood-driven backgrounds, music player).
- Make the codebase easy to extend (new themes, new widgets) without re-wiring everything.
- No backend — stays 100% client-side, localStorage-based, no tracking.

**Non-goals:**
- No account system / cloud sync (future consideration, not in this version).
- No mobile app — responsive web only.
- Not pixel-porting the old CSS; rebuilding cleaner with CSS variables, same visual language.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React (Vite) |
| Styling | Plain CSS w/ CSS custom properties per theme, one stylesheet per component (or CSS modules) |
| State/persistence | React Context + `localStorage` (no external state library needed at this scale) |
| Audio | HTML5 `<audio>` elements driven by a shared `AudioContext` provider |
| Icons | Font Awesome (kept from original) |
| Fonts | Inter, Press Start 2P, Kalam (kept from original) |
| Build/deploy | Vite build → static hosting (GitHub Pages / Vercel / Netlify, no server needed) |

---

## 3. Information Architecture

```
moodbyte/
  public/
    assets/
      music/        (reused from original repo, ~96MB)
      ambient/       (reused, ~159MB)
      sfx/           (reused, ~2.2MB)
      bg/            (reused, ~5.3MB)
  src/
    main.jsx
    App.jsx
    context/
      ThemeContext.jsx        # current theme, applies CSS vars to :root
      AudioContext.jsx        # single source of truth for music + ambient playback
      NotificationContext.jsx # in-app toast/notification queue
    hooks/
      useLocalStorage.js      # generic get/set/sync hook
      usePomodoro.js          # timer logic, runs independent of UI mount/unmount
    components/
      layout/
        Sidebar.jsx / Nav.jsx
        ThemeBackground.jsx
      mood/
        MoodSelector.jsx
        MoodHistory.jsx
      tasks/
        TaskInput.jsx
        TaskList.jsx
        TaskStats.jsx
      pomodoro/
        Timer.jsx
        TimerControls.jsx
        SessionStats.jsx
      notes/
        StickyNoteBoard.jsx
        StickyNote.jsx
      music/
        Player.jsx
        Playlist.jsx
        AmbientMixer.jsx
      settings/
        SettingsPanel.jsx
      stats/
        StatsDashboard.jsx
    pages/
      Home.jsx
      Settings.jsx
      Archive.jsx     # mood history / journal archive view
      About.jsx
    utils/
      moodConfig.js    # mood -> icon/theme/message map
      storageKeys.js   # centralized localStorage key names
  README.md
  index.html
  vite.config.js
```

---

## 4. Feature Specifications

### 4.1 Mood Journal
- 6–8 mood options (great, good, okay, meh, bad, angry, etc.), each mapped to an icon and a suggested theme.
- Selecting a mood highlights it; optional reflection textarea.
- "Save" writes an entry `{ mood, reflection, timestamp }` to `moodHistory` (capped at last 20, newest first — matches original behavior).
- Mood history view: card timeline, newest first, with date/time and reflection text.
- Optional: prompt user to switch theme to match mood (non-blocking suggestion, not automatic).
- Data export (JSON download) for mood history.

**Data shape:**
```ts
type MoodEntry = {
  mood: string
  reflection: string
  timestamp: string // ISO
}
```

### 4.2 Task Management
- Add/complete/delete tasks.
- Stats: total tasks, completed count, completion rate.
- Persisted in `tasks` key, shape `{ id, text, completed, createdAt }`.
- Feed completions into the shared stats dashboard (original had a `trackTaskCompletion` hook into `stats.js` — replicate via context or callback prop, not a global function).

### 4.3 Pomodoro Timer
- Work / short break / long break modes, configurable durations.
- Circular progress indicator.
- Runs via `usePomodoro` hook so timer state survives navigating between pages (lives in a top-level provider, not component-local state).
- Sound + in-app notification on session end.
- Session count persisted for stats.

### 4.4 Sticky Notes
- Create/edit/delete notes, color picker.
- Freely draggable position (store `{x, y}` per note).
- Persisted under `stickyNotes` key.
- Responsive grid fallback for small screens (drag disabled, stacks vertically).

### 4.5 Music Player + Ambient Sounds
- Curated track library pulled from `public/assets/music/`.
- Standard transport controls: play/pause, next/prev, shuffle, loop, volume, scrubbing.
- Ambient layer (rain/night/chill/productive loops from `public/assets/ambient/`) playable simultaneously and independently of the main track, with its own volume.
- Single `AudioContext` provider owns both `<audio>` elements so play state isn't duplicated across components.
- Keyboard shortcut: spacebar toggles play/pause (only when focus isn't in a text input).

### 4.6 Theme System
- Themes: Chill, Productive, Rainy, Night.
- Each theme = a set of CSS custom properties (colors, background image/animation) applied to `:root` via `ThemeContext`.
- Theme persisted in `theme` key; restored on load.
- Background visuals reuse `public/assets/bg/` per theme.

### 4.7 Settings
- Theme picker, audio defaults (volume, autoplay ambient), accessibility (high contrast, font size).
- Data management: export all app data (single JSON blob) and import/restore.
- Settings persisted under `settings` key as one object (avoids key sprawl).

### 4.8 Stats Dashboard
- Aggregates: tasks completed, pomodoro sessions, mood entries over time.
- Simple charts (bar/line) — can use a lightweight lib (`recharts`) or hand-rolled SVG, decide at build time.

---

## 5. Cross-Cutting Concerns

- **Persistence:** one `useLocalStorage(key, defaultValue)` hook used everywhere; no component reads/writes `localStorage` directly.
- **Notifications:** original used browser Notification API + custom snackbar (`notifications.js`) — rebuild as a `NotificationContext` with a toast queue; browser push notifications optional/permission-gated.
- **No global functions / no `typeof xyz === 'function'` cross-file checks** (a smell in the old code, e.g. `stats.js` functions called conditionally from `tasks.js`) — replaced with explicit context calls or props.
- **Routing:** lightweight — could be plain state-based tab switching (matches original single-page feel) rather than pulling in React Router, unless multi-page URLs are wanted (e.g. for `/settings`, `/archive`).

---

## 6. Open Decisions (to confirm before/while building)

1. **Routing:** tabs within one page vs. React Router with real URLs?
2. **Charts library** for stats dashboard, or hand-rolled?
3. CSS Modules vs. plain global CSS per component — affects how closely we can reuse the old `style.css` variables.

**Out of scope:** the `SONDER/` folder in the original repo is an unrelated/mixed-in project — not part of MoodByte and won't be carried into the rebuild.

---

## 7. Build Order (incremental, per your preference)

1. Scaffold Vite + React project, copy assets into `public/assets/`, set up `ThemeContext` + base layout.
2. **Mood journal** (selector + history + export) — first feature.
3. Task management.
4. Pomodoro timer.
5. Sticky notes.
6. Music player + ambient mixer.
7. Settings panel + data export/import.
8. Stats dashboard tying everything together.
9. README + deployment.

---

## 8. Acceptance Criteria (per feature)

- Feature is usable with no console errors.
- Data persists across page reloads via localStorage.
- Matches or improves on original feature behavior (see section 4 for original behaviors to preserve).
- Respects current theme's CSS variables (no hardcoded colors in component CSS).
- Responsive down to mobile width (~375px).
