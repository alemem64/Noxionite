# Deployment Contract

## Source Of Truth

- Package manager: `packageManager` in `package.json`
- Node runtime: `engines.node` in `package.json`
- Vercel build command: `pnpm run build`
- Local build command: `npm run build` or `pnpm run build`
- CI workflow: `.github/workflows/build.yml`

## Contract

- Production runs on Node `22.x`. Do not use a broad engine range such as
  `>=18`, because Vercel may auto-upgrade to a newer major runtime.
- Keep `package.json`, `package-lock.json`, and `pnpm-lock.yaml` aligned.
  Vercel uses `pnpm-lock.yaml`; local users may still use npm.
- Next.js must stay on a non-vulnerable patched release. For the current
  Next 15.5 line, the minimum patched version is `15.5.9`.
- Build must not depend on system Chrome libraries in Vercel.

## Verification

- `npx pnpm@10.11.1 install --frozen-lockfile --strict-peer-dependencies`
- `npm run build`
- Confirm Vercel logs show Next.js `15.5.9` or newer patched release.
