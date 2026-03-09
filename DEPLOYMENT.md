# Production Deployment (clavio-inky.vercel.app)

Use this checklist when deploying or updating the production environment.

## Production URL

**https://clavio-inky.vercel.app**

---

## 1. Vercel Environment Variables

In **Vercel Dashboard** → Project → Settings → Environment Variables, add all variables from `.env`. For production, set:

| Variable | Production Value |
|----------|------------------|
| `NEXT_PUBLIC_APP_URL` | `https://clavio-inky.vercel.app` |
| All other vars | Same as local `.env` |

---

## 2. Supabase

**Authentication** → **URL Configuration** → **Redirect URLs** — add:

```
https://clavio-inky.vercel.app/**
https://clavio-inky.vercel.app/api/auth/callback
```

---

## 3. Stripe

**Developers** → **Webhooks** → Add endpoint:

- **URL:** `https://clavio-inky.vercel.app/api/stripe/webhook`
- Copy the signing secret and add as `STRIPE_WEBHOOK_SECRET` in Vercel (production env only if using separate prod webhook)

---

## 4. LinkedIn (if enabled)

**Developer Console** → your app → **Auth** → **Authorized redirect URLs** — add:

```
https://clavio-inky.vercel.app/api/linkedin/callback
```

---

## 5. Local vs Production

- **Local `.env`**: Keep `NEXT_PUBLIC_APP_URL=http://localhost:3001` for development.
- **Vercel env vars**: Use `https://clavio-inky.vercel.app` for `NEXT_PUBLIC_APP_URL`.
