# MUDARRIS JOIN

MUDARRIS JOIN is an open classroom quiz and live-game platform.

## Roles

- **Teachers:** Anyone can create a teacher account with an email address and password. Teachers sign in to create and manage their own quizzes, classes, game sessions and reports.
- **Students:** Students do not create accounts or sign in. They enter the six-digit game PIN, choose a nickname and avatar, and join the live game.

There is no school administrator role, school-wide administrator dashboard, or invitation-only teacher registration.

## Teacher workflow

1. Create an account with any valid email address and a password of at least 8 characters.
2. Sign in with that email address and password. Google sign-in and registration are optional and work only when OAuth is configured.
3. Create and save a quiz.
4. Choose a game mode and host the live session.
5. Share the six-digit PIN. Students join directly without accounts.

Teacher-owned quizzes, classes, sessions and reports are scoped to the signed-in teacher.

## Stack

- Cloudflare Pages for the web application
- Cloudflare Pages advanced-mode Worker (built from `functions/[[path]].js`) for the Pages API
- Separate Cloudflare Worker in `cloudflare-worker/worker.js` for the Vercel API rewrite
- Cloudflare D1 for teachers, quizzes, questions, classes, sessions, players and answers
- GitHub repository: https://github.com/Ayyubprog/Mudarris-Join

## Cloudflare configuration

The Pages project is `mudarris-join`. Its D1 binding is `DB`.

Google OAuth is optional. Email/password teacher registration does not depend on Google OAuth or any school invitation. Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the API runtime to enable Google sign-in and registration.

The Pages Google OAuth callback URL is:

`https://mudarris-join.pages.dev/api/auth/google/callback`

The separate Worker uses `cloudflare-worker/wrangler.toml`; its `APP_ORIGIN` is currently the Vercel application URL.

## Database

The schema is in `migrations/0004_cloudflare_d1.sql`. It has already been applied to the dedicated `mudarris-join-db` database. Legacy `school_admins` and `invited_users` tables may remain for compatibility, but the application no longer reads or writes them. No existing teacher or game data is deleted by this change.

## Deployment

GitHub Actions builds and deploys the Cloudflare Pages site and separately deploys the API Worker when the relevant source files change. The workflow requires the repository secret `CLOUDFLARE_API_TOKEN` with permission to deploy Pages and Workers.
