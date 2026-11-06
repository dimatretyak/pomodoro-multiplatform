# Pomidoro

**English** | [Русский](README.ru.md)

A local Pomodoro timer with exercises during breaks: breathing, eyes, back and neck.
No server and no network: everything is stored in the browser's `localStorage` (key `pomidoro:v1`).

## Getting started

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # node --test: timer and exercise logic
npm run build    # tsc + vite build → dist/
```

## Deploying to GitHub Pages

The `.github/workflows/pages.yml` workflow runs the tests, builds `dist/` and publishes it on every push to `main`.
One-time setup: Settings → Pages → Source: **GitHub Actions**. The site will be available at
`https://<user>.github.io/<repo>/`. The build uses relative paths (`base: './'`), so it works both
from a subpath and on a custom domain.

## Testing on a phone over the local network

```sh
npm run cert            # self-signed certificate in .cert/ (Mac IP from en0); rerun if the IP changes
npm run dev:https       # dev server at https://<IP>:5173
npm run preview:https   # production build (with offline support) at https://<IP>:4173
```

The browser will warn about the certificate; that's expected. The timer works after "proceed anyway".
Notifications and offline mode require the certificate to be trusted:

- iPhone: send `.cert/cert.pem` (AirDrop) → Settings → "Profile Downloaded" → Install →
  General → About → Certificate Trust Settings → enable `pomidoro-dev`.
  On iOS, notifications only work from the installed app ("Add to Home Screen").
- Android: Settings → Security → Encryption & credentials → Install a certificate → CA certificate.

**Security.** The certificate is a root (CA) certificate. Anyone with `.cert/key.pem` can issue certificates
that the phone will trust. `nameConstraints` limits them to localhost and the Mac's IP, but not every platform
enforces that constraint. So never share the key (it's in `.gitignore`); the certificate is valid for 30 days;
remove the profile from the phone once you're done testing.

## Features

- Focus → short break ×N → long break. The timer counts from timestamps,
  so it survives a tab reload and doesn't fall behind in the background.
- Sound (Web Audio, no files), system notification (if allowed), time in the tab title.
  Optional clock ticking during focus.
- Background sound during focus: rain, waves, forest, fireplace, noise. Synthesized in the browser
  (`src/ambient.ts`), no files, works offline. Volume in settings.
- Exercises are chosen in settings: several or none. The selected ones rotate
  from break to break; the "Another exercise" button switches the current one.
- "What are you working on?" field: the task is attached to each completed focus session, recent tasks
  are suggested as you type.
- Calendar: day intensity = focus minutes; clicking a day shows its sessions and a per-task breakdown.
  A focus session can be opened to add or fix its task. Editing sets `updatedAt`,
  and on import the newer version of a record wins.
- Statistics (top-left button): today, 7 days, all time, day streak, 14-day focus chart.
- "Instrument" design: a 60-tick dial, grain, monospaced labels. Settings offer 14 palettes plus "Custom colors",
  each defining the colors for focus, short break and long break (colors in `src/index.css`, `[data-palette]`).
- Dark, light and automatic (system) theme.
- 9 languages: Russian, English, Spanish, German, French, Portuguese, Italian,
  Chinese, Japanese. Defaults to the browser language, switchable in settings.
  Russian and English are written inline in the code: `t('по-русски', 'in English')`. The other languages live
  in `src/locales/*.ts`, keyed by the English string. A test checks that every dictionary translates
  every UI string, so a new string without a translation fails `npm test`.
- JSON export and import in settings. Import merges history by `id` and keeps the newer
  settings. This lets you move data to another device by hand.
- Offline: a service worker (production build only) caches the app on the first visit.
  `manifest.webmanifest` makes it installable as an app (on iOS: "Add to Home Screen").
- Keyboard shortcuts (work with any keyboard layout): Space — start/pause, R — reset, N or → — next,
  E — another exercise, T — task, A — statistics, C — calendar, S — settings, ? — help, Esc — close.
  Resetting a started phase and "Next" ask for confirmation: Y / Enter — yes, N / Esc — no.

## Structure

| File | Contents |
|---|---|
| `src/timer.ts` | pure phase logic: start/pause/next/reset |
| `src/exercises.ts` | exercise data, `stepAt()` |
| `src/storage.ts` | localStorage, export, import with validation |
| `src/stats.ts`, `Stats.tsx`, `Calendar.tsx` | per-day aggregates, streak, statistics, calendar |
| `public/sw.js` | offline cache, notification click |
| `src/alerts.ts` | sound and notifications |
| `src/App.tsx` | timer state and effects |
| `src/Instrument.tsx`, `face.tsx` | main screen and shared helpers |
| `src/Settings.tsx`, `Panel.tsx` | settings and panel UI |

## Syncing between devices

Browsers have no built-in API that syncs web app data between devices
(`chrome.storage.sync` is only available to extensions). Options for the future:

1. Manual JSON export/import: already available in settings.
2. Local-first sync via a server: Dexie Cloud, PouchDB + CouchDB, Yjs/Automerge with a relay server.
3. A custom backend with accounts. Needed for Toggl-style features: projects, tags, rates.

History records are already stored as JSON with an `id` and timestamps, and settings have `updatedAt`,
so future sync comes down to merging records, without rewriting the storage.

## Limitations

- If the tab is closed, the alert won't sound: a web page can't wake itself up.
  It fires the next time the app is opened.
- The asset cache grows with each deploy (old hashes aren't removed). To clear it,
  bump `CACHE` in `public/sw.js`.
