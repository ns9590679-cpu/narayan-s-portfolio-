# Narayan — Portfolio (static, no build step)

Plain **HTML + CSS + JS** — no npm, no Vite, no framework, no build step.
Three.js loads straight from a CDN via an import map. Upload these 3 files
to a GitHub repo, flip on GitHub Pages, and it's live.

## Files

```
index.html   — structure + content
style.css    — all styling / design tokens / animations
script.js    — hero 3D scene (Three.js), scroll reveals, interactions
```

## Put it on GitHub — no other service needed

1. Go to **github.com → New repository**. Name it anything (e.g.
   `narayan-portfolio`). Leave it empty (don't add a README there — you
   already have one). Create it.
2. On the new repo's page, click **"uploading an existing file"** (or
   drag-and-drop) and upload `index.html`, `style.css`, and `script.js`
   directly through the browser — no git commands needed. Commit.
3. Go to the repo's **Settings → Pages**. Under "Build and deployment",
   set Source to **Deploy from a branch**, branch **main**, folder **/(root)**.
   Save.
4. Wait ~1 minute, then your site is live at
   `https://<your-username>.github.io/<repo-name>/`.

That's it — no Vercel, no Netlify, no CLI, no npm install.

## Previewing locally before uploading (optional)

Because `script.js` uses an ES module + import map, opening `index.html`
by double-clicking it won't work (browsers block module imports over the
`file://` protocol). Serve it locally instead:

```bash
# from inside this folder
python3 -m http.server 8000
# then open http://localhost:8000
```

Any local static server works — this is only needed for local preview;
GitHub Pages serves over https and works fine.

## Swapping in real content

- **Images**: search `images.unsplash.com` in `script.js` (projects,
  showcase strip) and `index.html` (portrait) — replace with Narayan's
  own work.
- **Copy**: bio is in `index.html` under `#about`; case studies and
  testimonials are the `projects` / `quotes` arrays near the top of
  `script.js`.
- **Email/socials**: search `hello@narayan.design` and the `socials`
  links in `index.html`.
- **Contact form**: it currently just shows "Sent ✓" after a delay —
  wire the `contactForm` submit handler in `script.js` up to a real
  service (Formspree, Getform, etc. all work with a static site and no
  backend of your own).

## Notes

- The 3D hero scene, custom cursor, and marquee animations are skipped
  automatically on touch devices, small screens, and when the OS
  "reduce motion" setting is on — a lighter experience loads instead.
- Everything is dependency-free except the one Three.js CDN import in
  `script.js`.
