# Environment configuration

Create a .env file in the project root with the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional demo/admin helpers
VITE_DEMO_MODE=false
VITE_ADMIN_EMAIL=
VITE_ADMIN_LIST=
```

Netlify build & functions environment (Site settings → Environment variables):

- SUPABASE_URL = same as VITE_SUPABASE_URL
- SUPABASE_ANON_KEY = same as VITE_SUPABASE_ANON_KEY

Notes:
- The frontend (Vite) reads variables prefixed with VITE_.
- The Netlify function `netlify/functions/inspections.js` reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the environment to proxy requests with the caller auth token.
- See `src/lib/supabase.ts` for the client initialization. The application will throw at startup if the Vite env vars are not present.
