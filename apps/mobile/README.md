A modern, cross-platform mobile application built with React Native (Expo) for ClaudyGod to deliver worship, ministry updates, and secure account access across mobile, TV, and web.



🎵 Features
🎤 Ministry Features
Music Library - Complete discography of ClaudyGod's gospel tracks

Lyrics Display - Synchronized lyrics for worship and sing-along

Event Management - Concert dates, worship nights, and ministry events

Video Content - Music videos, live performances, and ministry messages

Prayer Wall - Community prayer requests and support

Devotionals - Daily spiritual nourishment and Bible studies

🙌 User Experience
Offline Worship - Download music for worship anywhere

Personal Playlists - Create custom worship playlists

Event Reminders - Never miss a concert or ministry event

Social Features - Share music and testimonies

Bible Integration - Scripture references with songs

## 🛠 Technology Stack

| **Category**           | **Technology** |
|--------------------------|----------------|
| **Framework**            | React Native 0.81 (Expo SDK 54) |
| **Navigation**           | Expo Router (File-based routing) |
| **Styling**              | Theme-aware `makeStyles` hook over `StyleSheet` (see `theme/`, `constants/color.ts`) |
| **Language**             | TypeScript |
| **State Management**     | React Context (see `context/`) |
| **Database**             | Postgres via the Claudy API (Supabase-hosted) |
| **Authentication**       | Claudy API JWT + email verification/reset (currently guest-first — see `features/auth/README.md`) |
| **File Storage**         | Supabase Storage (via the Claudy API's admin upload pipeline) |
| **Audio Streaming**      | expo-audio |
| **Video Streaming**      | expo-video |
| **Push Notifications**   | Expo Notifications |
| **Code Quality**         | ESLint |
| **Testing**              | Jest (`jest-expo` preset) |
| **Deployment**           | EAS (Expo Application Services) |

---
## 🚀 Quick Start

Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo Go or an Expo development build

Setup

1. Create the repo root `.env.development`.
2. Set:
   - `EXPO_PUBLIC_API_URL`
3. Optional:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_KEY`
   These are no longer required for the public app auth flow.
4. Install dependencies: `npm install`
5. Start Expo: `npm run start:online`

Docker

- Web preview: `docker compose --env-file ../../.env.development -f docker-compose.dev.yml --profile web up --build`
- Native Expo dev server: `docker compose --env-file ../../.env.development -f docker-compose.dev.yml --profile native up --build`

## 🚀 Deployment (EAS)

1. Create the repo root `.env.production` and fill in your production values.
2. Set the same values in EAS secrets or your EAS environment.
3. Required mobile env values:
   - `EXPO_PUBLIC_API_URL`
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_KEY`
   - `EAS_PROJECT_ID`
4. Optional mobile env values:
   - `EXPO_ACCOUNT_OWNER`
     Set this if the project belongs to a specific Expo account/organization.
5. Keep bundle identifiers and package names in `app.config.js` aligned with your real store apps:
   - `ios.bundleIdentifier`
   - `android.package`
6. Build:
   - `eas build --profile preview --platform all`
   - `eas build --profile production --platform all`
7. For push notifications and EAS Updates, make sure the project is linked to a real EAS project so `extra.eas.projectId` resolves from env at build time.
8. Set `AUTH_PUBLIC_BASE_URL` in the backend env to your live public app origin, for example `https://app.example.com`.
9. The mobile app now uses the backend auth endpoints for sign-up, sign-in, verification, and password recovery. Transactional emails are queued by the API and delivered through the worker/Postfix/Brevo pipeline.

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 👥 Ministry Team

| **Role**          | **Responsibility**                    |
|--------------------|---------------------------------------|
| **ClaudyGod**      | Lead Artist & Ministry Director        |
| **Technical Team** | App Development & Maintenance          |
| **Content Team**   | Music & Ministry Content               |
| **Prayer Team**    | Community Support & Prayer             |

---

## 🆘 Support

For technical support and ministry inquiries:

- 📧 **Email:** [support@claudygod.org](mailto:support@claudygod.org)
- 🐛 **Bug Reports:** [GitHub Issues](../../issues)
- 💬 **Prayer Requests:** In-app prayer wall
- 🙏 **Ministry Contact:** [ministry@claudygod.org](mailto:ministry@claudygod.org)

---

## 🎵 Built for God's Glory with React Native & Expo 🎵

<div align="center">

*"I will sing of the Lord's great love forever;  
with my mouth I will make your faithfulness known through all generations."*  
— **Psalm 89:1**



⭐ **Star us on GitHub to support this ministry!**

</div>

---

## 📦 About This Codebase

This complete README and codebase include:

- 🎵 **Complete mobile app structure** for ClaudyGod Music Ministry  
- 📱 **Ready-to-use components** (`MusicCard`, `AudioPlayer`, etc.)  
- 🎨 **Consistent theming** with a single `makeStyles`/theme-token system (light + dark)  
- 🎧 **Music player functionality** with production-aligned content routing
- 🔐 **Authentication setup** using backend JWT and transactional email flows
- 🗂️ **Database schema** for ministry content  
- 🚀 **Deployment-ready** configuration for Expo EAS  
- 🙏 **Ministry-focused features** (Prayer wall, Scriptures, Events)

---

### 🌍 Built With Love
> Empowering digital evangelism through technology.  
> Every line of code glorifies God. ❤️
