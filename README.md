# Serenity Breathing 🌿

Serenity Breathing is a professional, production-ready mindfulness application designed to help users find their calm through guided breathing sessions. Built with React, Tailwind CSS, and Firebase, it offers a seamless and elegant experience for stress reduction and focus improvement.

## ✨ Features

- **Guided Breathing Modes**: Choose from Box Breathing, 4-7-8 (Sleep), and Coherence modes.
- **Custom Cycles**: Create your own breathing rhythm by adjusting inhale, hold, and exhale durations.
- **Progress Tracking**: Monitor your sessions, streaks, and total mindfulness minutes.
- **Daily Inspiration**: Receive curated mindfulness quotes to start your day.
- **Personalized Profile**: Save your health details and set daily reminders.
- **PWA Support**: Installable on mobile and desktop for offline access.
- **SEO Optimized**: Fully optimized for search engines with proper metadata and sitemaps.
- **Dark Mode**: Elegant dark and light themes for any environment.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Animations**: Motion (formerly Framer Motion)
- **Icons**: Lucide React
- **Backend**: Firebase (Authentication & Firestore)
- **Styling**: Shadcn UI components

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ha-re-ram/serenity-breathing.git
   cd serenity-breathing
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📦 Deployment

### Deploying to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login and initialize:
   ```bash
   firebase login
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy:
   ```bash
   firebase deploy
   ```

## 👤 Developer

**Hareram Kushwaha**
- Website: [hareramkushwaha.com.np](https://hareramkushwaha.com.np)
- GitHub: [@ha-re-ram](https://github.com/ha-re-ram)
- LinkedIn: [Hareram Kushwaha](https://www.linkedin.com/in/ha-re-ram)
- Email: hareramkushwaha054@gmail.com

## 📄 License

This project is licensed under the MIT License.
