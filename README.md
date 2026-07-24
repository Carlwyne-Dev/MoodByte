# MoodByte

MoodByte is a cozy digital workspace built for students, creators, and anyone who wants a calmer way to focus.

Instead of feeling like another productivity app, MoodByte recreates the comfort of a personal study desk—complete with ambient radio, animated pixel-art themes, sticky notes, a virtual study companion, and distraction-free focus tools.

Everything is designed around one goal:

**Make productivity feel peaceful, not stressful.**

---
**What makes MoodByte different?**
- 🌙 Cozy pixel-art environments with animated themes
- 📻 Live ambient FM radio inspired by classic radio tuning
- 📝 A study desk where notes, tasks, and calendar sync together
- 🐱 A virtual companion that grows alongside your focus sessions
- ⏱️ Built around relaxation first, productivity second

---

## Features

### Themes & Backgrounds

- **4 Built-in Themes** — Switch instantly between Night, Rainy, Chill, and Focus environments, each with unique animated pixel-art backgrounds, color palettes, and ambient visual effects.
- **Dedicated Appearance Modal** — Themes now have their own full-screen modal separate from Settings, giving you a clean space to preview and configure your look.
- **Custom Backgrounds** — Upload up to 3 wallpapers per theme. Your images are persisted in IndexedDB so they survive browser restarts without re-uploading.
- **Live UI Preview** — See a real-time glassmorphism preview of how your wallpaper looks behind MoodByte's UI before committing to it.
- **Automatic Background Rotation** — MoodByte cycles through both built-in and your custom backgrounds automatically.
- **Mood-Based Theme Suggestions** — After logging your mood, MoodByte suggests a matching theme and lets you switch with one click.

### Live Clock

- **Real-Time Display** — A beautiful, highly aesthetic live clock sits on the top left of the main board.
- **Animated Digits** — Each digit features a smooth, individual slide-up CSS animation, bringing life to the dashboard.
- **Hover Reveal** — AM/PM indicators elegantly slide out on hover to keep the interface minimal by default.

### Mobile Experience

- **Responsive Design** — Fully optimized for mobile with a custom bottom navigation bar and fluid app-like interactions.
- **Floating Music Pill** — On mobile, the music player minimizes into an elegant, auto-hiding pill that floats above the bottom nav.
- **App-like Sheets** — Mobile views use smooth slide-up sheets and trays instead of modal popups for a native feel.

### Study Desk

- **Full Zen Mode** — A distraction-free, full-screen study environment with its own ambient background.
- **Sticky Note Board** — Pin, drag, and recolor quick thoughts and reminders directly onto the screen.
  - **Live Task Sync** — Send your active tasks to a dynamic sticky note. Check off tasks right on the note, and watch them instantly sync with your main task list.
  - **Live Calendar Sync** — Export a specific day's calendar note to the board. Editing the sticky note instantly updates the calendar, and vice versa.
- **File Viewer** — Upload and read PDFs or `.txt` files directly inside the Study Desk without leaving the app.
- **Study Pet** — A virtual pixel-art pet that lives at the bottom of the study desk. Choose between 8 variants (Dog 1 & 2, Cat 1 & 2, Rat 1 & 2, Bird 1 & 2), name them, and watch them roam across the screen with smooth walking animations.
  - **Pet Dialogue** — Your pet comments on your focus session, break time, and idle state with unique rotating quotes and fun animal facts.
  - **Treat System** — Earn loot drops (Common, Rare, Epic, Legendary) by completing Pomodoro focus sessions. Open the Treat Stash and drag-and-drop treats using a custom physics engine. Your pet will sprint over and eat them!

### Pomodoro Timer

- Configurable work and break durations.
- Visual countdown with session state (Focusing / Break).
- Tracks total completed Pomodoro sessions for stats and achievements.
- Loot drops to your pet's Treat Stash at the end of each focus session.

### Music Player

- **Local Music** — Load MP3 files directly from your device and play them in-app.
- **Spotify Integration** — Paste a Spotify playlist/album link and open it directly.
- Playback controls: play, pause, previous, next, and track progress display.

### FM Radio

Turn the dial and tune into curated 24/7 ambient stations inspired by classic FM radios. Switch between lo-fi, jazz, chillhop, and relaxing background streams without ever leaving your study space.

- Multiple always-on radio stations
- Smooth radio-style tuning experience
- Designed to make MoodByte feel like a living room, not just a web app

### Mood Tracker

- Log your current mood from 8 states (Great, Good, Okay, Meh, Bad, Angry, Tired, Energetic).
- Add a personal reflection note to each log.
- Mood history stored locally (last 20 entries).
- View your mood breakdown as a visual bar chart in the Stats modal.
- Mood History panel to review past entries with their timestamps.

### Task Manager

- Add, complete, and delete tasks.
- Completed tasks are moved to a task history archive.
- Task completion counts toward your streak and achievements.

### Stats & Analytics

- **Stats Modal** — Visual overview of your productivity including:
  - Total completed tasks
  - Total Pomodoro sessions
  - Total moods logged
  - A mood frequency bar chart
  - Full achievement board (locked/unlocked state)

### Achievements

- 9 unlockable milestones across Tasks, Focus, and Moods:
  - First Step — Complete 1 task
  - Task Master — Complete 10 tasks
  - Unstoppable — Complete 50 tasks
  - Getting Started — Finish 1 Pomodoro
  - Deep Focus — Finish 5 Pomodoros
  - Zen Master — Finish 20 Pomodoros
  - In Touch — Log your first mood
  - Self Aware — Log 7 moods
  - Emotional Guru — Log 30 moods
- **Live Popup Notifications** — When you unlock an achievement, a sleek glass-morphism popup drops from the top of the screen with a sound effect.
- **Queue System** — If multiple achievements unlock at once, they display one by one so none are missed.

### Daily Streak

- A fire icon in the top-right corner tracks your daily activity streak.
- The fire animates in full color when you're active and goes grey when your streak is at risk.
- Hover to see your current streak count and a message about your progress.
- A streak counts when you log a mood, complete a task, or archive a finished task in a given day.

### Cloud Sync & Settings

- **Cross-Platform Sync** — Log in with your Google account via Supabase OAuth to synchronize all your tasks, stats, and settings across your PC and mobile devices.
- **Danger Zone** — A dedicated option inside the Settings modal to instantly and securely erase all your local and cloud data if needed.
- **Dedicated Modals** — Settings and Appearance (Themes) are thoughtfully separated to give each the space they need without feeling cramped.
- **Pomodoro Configuration** — Adjust your focus and break durations inside the main view.
- **Pet Configuration** — Enable/disable, pick an animal, and rename your pet from the Study Desk settings.

### Onboarding

- A welcome modal greets new users and walks them through MoodByte's features.
- A separate welcome modal plays when opening the Study Desk for the first time.
- Both modals only show once (tracked via localStorage).

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Vanilla CSS (glassmorphism, CSS variables, keyframe animations) |
| Persistence | localStorage + IndexedDB + Supabase |
| Authentication | Supabase OAuth (Google) |
| Icons | Lucide React |
| Pet Physics | Custom `requestAnimationFrame` loop (60fps DOM animation) |
| Audio | Web Audio API (`new Audio()`) |

---

## How to Use the Study Pet

1. Open the **Study Desk** from the main page.
2. Click the **pet icon** on the upper right of the Study Desk to open the **Pet Panel**. Enable your pet, pick an animal, and give it a name.
3. Run the **Pomodoro Timer** and finish a focus session. A loot drop will appear when it's done.
4. Click the **Treat Stash** (gift icon), select a treat rarity, and click anywhere on the screen to toss it. Your pet will run over and eat it!

---

## How Custom Backgrounds Work

1. Open **Settings** and go to the **Appearance** section.
2. Choose a theme tab (Night, Rain, Chill, Focus).
3. Click any of the 3 upload slots, pick an image, and it saves automatically.
4. The background is stored in IndexedDB — it persists across browser sessions without re-uploading.
5. To remove a custom background, click the trash icon on its slot. The file is removed from both IndexedDB and memory.

---

## License

This project is open source and available under the [MIT License](LICENSE).
