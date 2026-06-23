# MoodByte

MoodByte is a personal, highly aesthetic productivity web app designed to help you relax, focus, and get things done. It blends a cozy study environment with powerful tools, all wrapped in a beautifully customizable interface.

---

## Features

### Themes & Backgrounds
- **4 Built-in Themes** — Switch instantly between Night, Rainy, Chill, and Focus environments, each with unique animated pixel-art backgrounds, color palettes, and ambient visual effects.
- **Custom Backgrounds** — Upload your own background images (up to 3 per theme). Your custom wallpapers are persisted in IndexedDB so they survive browser restarts without re-uploading.
- **Automatic Background Rotation** — MoodByte rotates through both default and your custom backgrounds automatically while keeping all defaults available.
- **Mood-Based Theme Suggestions** — After logging your mood, MoodByte suggests a matching theme (e.g., "Rainy" for a bad mood) and lets you switch with one click.

### Study Desk
- **Full Zen Mode** — A distraction-free, full-screen study environment with its own ambient background.
- **Sticky Note Board** — Pin, drag, and recolor quick thoughts and reminders directly onto the study desk wall.
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

### Settings
- Toggle and configure each section of the UI.
- Custom background manager per theme (up to 3 slots each).
- Full preview of your custom backgrounds before saving.
- Pet settings (enable/disable, choose type, set name).
- Pomodoro duration configuration.

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
| Persistence | localStorage + IndexedDB (via custom hooks) |
| Icons | Lucide React |
| Pet Physics | Custom `requestAnimationFrame` loop (60fps DOM animation) |
| Audio | Web Audio API (`new Audio()`) |

---

## Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Carlwyne-Dev/MoodByte.git
   cd MoodByte
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

---

## How to Use the Study Pet

1. Open the **Study Desk** from the main page.
2. Click the settings icon on the upper right to open **Pet Settings**. Enable your pet, pick an animal, and give it a name.
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
