<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4365d1de-dac3-4679-bd9f-00ef2b780550

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env` (not committed) based on `.env.example`
3. Run the API:
   `npm run dev:api`
4. Run the app:
   `npm run dev`

## Supabase

- `profiles.phone_number` migration: [supabase_migrations/2026-03-29_add_profiles_phone_number.sql](supabase_migrations/2026-03-29_add_profiles_phone_number.sql)
- “无验证码手机号注册” requires `SUPABASE_SERVICE_ROLE_KEY` to be set on the API server side.
