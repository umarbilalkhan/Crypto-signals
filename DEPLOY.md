# Deployment Guide

This project is set up as a **monolithic Node.js application**. The backend (Express) serves the frontend (React/Vite) static files.

## Prerequisites

- A GitHub account.
- An account on a hosting provider like **Render**, **Heroku**, or **Railway**.

## Deployment Steps (Recommended: Render.com)

Render is the easiest way to deploy this full-stack application for free.

1.  **Push to GitHub**:
    - Ensure your project is pushed to a GitHub repository.

2.  **Create a Web Service on Render**:
    - Go to [dashboard.render.com](https://dashboard.render.com/).
    - Click **New +** -> **Web Service**.
    - Connect your GitHub repository.

3.  **Configure the Service**:
    - **Name**: `crypto-signals` (or any name you like).
    - **Region**: Choose the one closest to you.
    - **Branch**: `main` (or `master`).
    - **Runtime**: `Node`.
    - **Build Command**: `npm install && npm run build`
        - *This installs dependencies and builds the React frontend.*
    - **Start Command**: `npm start`
        - *This starts the Express server which serves the frontend.*

4.  **Deploy**:
    - Click **Create Web Service**.
    - Render will build your app and deploy it.
    - Once finished, you will get a URL (e.g., `https://crypto-signals.onrender.com`).

## Alternative: Vercel (Frontend Only / Serverless)

If you prefer Vercel, note that this project uses a custom Express server. Vercel is optimized for Next.js or static sites.
To deploy on Vercel, you would typically need to refactor the backend into `api/` serverless functions.
**The Render method above is recommended** as it preserves your exact project structure.
