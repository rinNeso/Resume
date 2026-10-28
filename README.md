# Resume

Source for [resume.heiland.tv](https://resume.heiland.tv): my resume, plus the side projects and repos behind it.

Vue 3 + Vuetify 3 + Vite. Pushing to `main` lints, tests, builds and deploys it to
GitHub Pages (`.github/workflows/deploy.yml`); `public/CNAME` sets the custom domain.

## Editing

The words live in `src/data`; the components only lay them out.

- [`src/data/resume.js`](src/data/resume.js): the profile, experience, skills,
  education and the project cards.
- [`src/data/details.js`](src/data/details.js): the project pages
  (`/projects/<id>/`), keyed by the project `id` in `resume.js`.
- `src/data/soloref-haptics.js`: SoloRef's haptic patterns, copied from the app.
- `src/data/worlds-snapshot.json`: a saved copy of the worlds-cal feed, which
  the worlds-cal page shows when the live feed can't be reached. A daily
  workflow (`.github/workflows/worlds-snapshot.yml`) refreshes it with
  `npm run snapshot`.

```sh
npm ci
npm run dev      # http://localhost:3000
npm run lint     # eslint, no warnings allowed (lint:fix to fix what it can)
npm test
npm run build    # outputs dist/
```

`npm run build` also runs `scripts/route-pages.mjs`, which writes an HTML file per
project page with its own title, description and link-preview tags, a no-JavaScript
copy of each page's content, `404.html`, `sitemap.xml` and `robots.txt`. It reads
the same data files, so there's nothing extra to update.

`public/og-image.png` (the link-preview image), `public/apple-touch-icon.png` and
`public/favicon.ico` are rendered from the HTML templates in `scripts/` with
`npm run images`, which needs a local Chrome or Chromium. Re-run it if the name,
role or theme colors change.

`public/Nathan-Heiland-Resume.pdf` is the downloadable resume. It's built in the
private `rinNeso/resume-doc` repo with `python3 build.py --public`, which leaves
out the phone number, and copied here.

The theme (colors for light and dark) is in `src/plugins/vuetify.js`, and the
site-wide type rules are in `src/styles/main.scss`. The page follows the
visitor's system light/dark setting.

The Content-Security-Policy is a meta tag in `index.html`. A new external fetch
or image host has to be added to its `connect-src` or `img-src` first.
