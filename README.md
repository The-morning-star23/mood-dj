# Mood DJ 🎵

A Full-Stack Next.js application that uses GenAI to curate music playlists based on your mood.

## Table of contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Geting Started](#quickstart)
- [Usage](#usage)

## Overview
Mood DJ generates mood-based playlists using Google Gemini and serves audio streams stored in MongoDB. It includes analytics for song popularity and caching for high-performance leaderboards.


## 🚀 Features
- **Smart Mixes:** Upload your MP3 library and let Google Gemini AI create the perfect flow for your current vibe.
- **Audio Streaming:** Binary audio data is streamed directly from MongoDB to the browser.
- **Analytics:** Tracks song popularity using MongoDB Aggregation.
- **High Performance:** Leaderboard stats are cached via Redis (Upstash) to reduce DB load.

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** MongoDB (Metadata & Audio Buffers)
- **AI Model:** Google Gemini 2.0 Flash
- **Caching:** Redis (Upstash)
- **Styling:** Tailwind CSS + Glassmorphism UI

## ⚙️ Environment Variables
Create a `.env.local` file with the following keys:
```bash
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_ai_key
REDIS_URL=your_upstash_redis_url
```

## 🏃‍♂️ Getting Started
1. Clone the repository:
   git clone https://github.com/The-morning-star23/mood-dj.git
2. Install dependencies:
   npm install
3. Start development server:
   npm run dev
4. Open: http://localhost:3000

## 📸 Usage
1. **Upload:** Drag & drop MP3 files (format: `Artist - Title.mp3`).
2. **Prompt:** Enter a mood (e.g., "Late night coding").
3. **Listen:** The AI selects and plays the tracks.
4. **Stats:** Check the "Top Charts" for most played songs.