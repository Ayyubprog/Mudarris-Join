# MUDARRIS JOIN

MUDARRIS JOIN is a classroom quiz and live game platform for Mudarris School.

## Stack

- Cloudflare Pages for hosting
- Cloudflare Pages Worker (functions/[[path]].js) for the API
- Cloudflare D1 for teachers, quizzes, questions, classes, sessions, players and answers
- GitHub repository: https://github.com/Ayyubprog/Mudarris-Join

## Teacher workflow

1. Create an account with any valid email and password, or use Google account creation once OAuth is configured.
2. Sign in later with email/password or Google. Google sign-in and Google account creation use separate buttons.
3. Create a Kahoot manually: title, subject, grade, questions and answers.
3. Save it to My Kahoots.
4. Choose Play on a saved Kahoot.
5. Pick a live game mode on the separate mode-selection page.
6. Share the six-digit PIN with students and host the session.

Game modes currently presented in the picker: Classic, Team Mode, Accuracy, Confidence, Marble Race, Racing Cars (MUDARRIS JOIN original), Color Kingdoms, Tallest Tower, Treasure Trove, Submarine Squad, Robot Run and Cosmic Conquest.

## Cloudflare setup

The Pages project is mudarris-join and the D1 binding is DB.

Optional Pages environment variables:

- ADMIN_EMAIL: the school administrator email. When this address creates an account or signs in, it receives administrator permissions.
- GOOGLE_CLIENT_ID: Google OAuth client ID.
- GOOGLE_CLIENT_SECRET: Google OAuth client secret.

Google OAuth redirect URI:

https://mudarris-join.pages.dev/api/auth/google/callback

Email/password account creation is open. The configured ADMIN_EMAIL receives school administrator access on sign-up or next successful sign-in. Google account creation and sign-in require GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.

## Database

The Cloudflare D1 schema is in migrations/0004_cloudflare_d1.sql. It has already been applied to the dedicated mudarris-join-db database.

## Deployment note

The first Cloudflare Pages production deployment was uploaded directly and is live. Cloudflare's GitHub integration returned an internal Git installation error when automatic source linking was attempted, so GitHub-to-Cloudflare automatic deploys are not enabled yet. The deployed site is not using Hatchable; the old Hatchable-specific API files and configuration have been removed from this repository.
