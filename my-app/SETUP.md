# Setup

## Install

```bash
npm install
```

## Environment Variables

Create `.env` in the `my-app` project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Vite only exposes variables prefixed with `VITE_`.

## Supabase Auth

Enable Email auth in Supabase Authentication.

For local development, add this URL in Supabase Authentication settings:

```txt
http://localhost:5173
```

If email confirmation is enabled, new users must confirm their email before
they can sign in.

## Supabase Database

Run the SQL files in `supabase/migrations` against your Supabase project before
using the app. For an existing database that is missing sale payment columns,
run:

```txt
supabase/migrations/202607070001_add_sales_payment_columns.sql
```

## Run Locally

```bash
npm run dev
```

## Build

```bash
npm run build
```
