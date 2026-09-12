# Creditxora — frontend

Next.js 16 (App Router) + React 19 + Tailwind CSS v4.

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL -> the FastAPI backend
npm run dev                  # http://localhost:3000
```

The app needs the FastAPI backend running on port 8000 and MongoDB behind it.
**Setup, architecture, demo accounts and the pre-launch checklist are in the
[root README](../README.md).**

## Layout

| Path                   | Contents                                              |
| ---------------------- | ----------------------------------------------------- |
| `src/app/(marketing)/` | Public site — home, services, resources, legal         |
| `src/app/get-started/` | Five-step credit assessment wizard                     |
| `src/app/portal/`      | Client portal (role: `client`)                         |
| `src/app/admin/`       | Admin / CRM dashboard (roles: `admin`, `specialist`)   |
| `src/components/ui/`   | Design-system primitives                               |
| `src/lib/`             | API client, auth context, wire types, site content     |

Design tokens (the navy/green brand palette, shadows, gradients and the
composite utilities such as `bg-navy-mesh` and `card-surface`) are defined once
in `src/app/globals.css`.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build + type check
npm start        # serve the production build
npx eslint src   # lint
```
