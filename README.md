# MoodByte ✨

MoodByte is a personal, highly aesthetic web space designed to help you relax, focus, and get things done. Whether you're studying for an exam, working on a project, or just chilling out, MoodByte provides a dynamic and engaging environment tailored to your current mood.

## 🚀 Features

* **Dynamic Themes:** Instantly switch between curated aesthetic environments (Night, Rainy, Chill, and Focus) with animated backgrounds and color schemes.
* **Study Desk Mode:** Enter a full-screen, distraction-free "Zen Mode".
  * **Study Pet:** A virtual pet that lives at the bottom of your screen! Choose between different pets (Dog, Cat, Rat, Bird), name them, and watch them roam around. 
  * **Treat System:** Complete Pomodoro focus sessions to earn loot drops of varying rarities (Common, Rare, Epic, Legendary). Drag and drop these treats using a fully custom physics engine to feed your pet!
  * **File Viewer:** Upload and read PDFs or text files directly inside the Study Desk without opening another tab.
* **Music Player:** Listen to your favorite Spotify playlists or load up your own local music to stay in the zone.
* **Pomodoro Timer:** Built-in productivity timer to manage your work/break cycles.
* **Sticky Note Board:** Pin quick thoughts and reminders to your interactive wall.
* **Task Manager:** Keep track of your daily to-do lists.
* **Mood Tracker:** Log how you're feeling and track your vibes over time.

## 🛠️ Technology Stack

* **Frontend:** React + Vite
* **Styling:** Vanilla CSS focusing on modern glassmorphism, responsive design, and CSS variables. 
* **Animations:** Custom requestAnimationFrame loops for high-performance (60fps) DOM manipulation (used heavily in the Study Pet physics engine).
* **Icons:** Lucide React

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/moodbyte.git
   cd moodbyte
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local server URL (usually `http://localhost:5173`).

## 💡 How to use the Study Pet

1. Open the **Study Desk** from the main page.
2. Click the gear icon on the right to open the **Pet Settings**. Turn your pet on, choose an animal, and give it a name!
3. Open the **Pomodoro Timer** and finish a focus session. When the timer finishes, you'll receive a loot drop of treats!
4. Click the **Treat Stash** (gift icon), select a treat, and click anywhere on the screen to toss it. Watch your pet sprint over and eat it!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
