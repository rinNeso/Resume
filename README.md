# Resume

Source for [resume.heiland.tv](https://resume.heiland.tv): my resume, plus the side projects and repos behind it.

Vue 3 + Vuetify 3 + Vite. Pushing to `main` builds and deploys it to GitHub Pages
(`.github/workflows/deploy.yml`); `public/CNAME` sets the custom domain.

## Editing

All of the content lives in [`src/data/resume.js`](src/data/resume.js). The
components only lay it out, so updating the resume means editing that one file.

```sh
npm ci
npm run dev      # http://localhost:3000
npm run build    # outputs dist/
```

`public/Nathan-Heiland-Resume.pdf` is the downloadable resume. It's built in the
private `rinNeso/resume-doc` repo with `python3 build.py --public`, which leaves
out the phone number, and copied here.

The theme (colors for light and dark) is in `src/plugins/vuetify.js`, and the
site-wide type rules are in `src/styles/main.scss`. The page follows the
visitor's system light/dark setting.
