# My Recipes

A personal recipe collection. Drop a Markdown file into a folder under
`recipes/`, push, and it's on your phone a minute later.

**Live site:** https://superlalapa.github.io/my-recipes/

---

## Adding a recipe

### From your phone (no laptop needed)

1. Open the repo on github.com.
2. Go into `recipes/` and pick a category folder (or make a new one).
3. **Add file → Create new file**, name it `something.md`.
4. Paste the template below, fill it in, commit to `main`.
5. The site rebuilds and redeploys automatically. Refresh after a minute.

Every recipe page also has an **"Edit this recipe on GitHub"** link at the
bottom, which is the fastest way to fix a quantity while you're cooking.

### From your laptop

```bash
npm run new -- "Thai Green Curry" mains
```

That creates `recipes/mains/thai-green-curry.md` from a template and tells you
the URL it will publish at. The category argument is optional and defaults to
`mains`.

---

## Recipe format

Only `title` is required — everything else is optional and simply isn't shown
if you leave it out.

```markdown
---
title: Thai Green Curry
description: A fast weeknight curry that tastes like it took far longer.
date: 2026-08-10
servings: 4
prep: 15 min
cook: 20 min
total: 35 min
difficulty: Easy
tags: [thai, spicy, weeknight]
image: curry.jpg          # optional, sits next to the .md file
source: https://…         # optional
sourceName: Bon Appétit   # optional label for that link
draft: true               # optional, keeps it off the site
---

## Ingredients

- 3 tbsp green curry paste
- 400 ml coconut milk

## Method

1. Fry the paste until fragrant.
2. Add everything else.

## Notes

Anything worth remembering next time.
```

The body is plain Markdown — no template syntax to escape.

A heading containing **"Ingredients"** turns the list under it into tickable
checkboxes. A heading containing **"Method"**, **"Steps"**, **"Instructions"**
or **"Directions"** turns its list into numbered, tickable steps. If you skip
the headings entirely, the first bullet list and first numbered list are used
instead.

---

## Categories

**The folder is the category.** No configuration, no registration step:

```
recipes/
├── breakfast/
│   └── shakshuka.md          →  /recipes/breakfast/shakshuka/
├── mains/
│   └── thai-green-curry.md
├── sides/
└── desserts/
```

Create a new folder and it appears on the home page on the next build, with
its name title-cased and a matching emoji picked automatically.

To override either, drop a data file in the folder named after the folder —
e.g. `recipes/sides/sides.11tydata.json`:

```json
{
  "categoryName": "Sides & Salads",
  "categoryIcon": "🥗"
}
```

### Photos

Put the image file next to the recipe and reference it by filename:

```
recipes/mains/thai-green-curry.md
recipes/mains/curry.jpg          →  image: curry.jpg
```

---

## On your phone

The site is built mobile-first. A few things worth knowing:

| Feature | What it does |
| --- | --- |
| **Add to Home Screen** | Installs it like an app — full screen, own icon. Safari: Share → Add to Home Screen. Chrome: ⋮ → Add to Home screen. |
| **Works offline** | A service worker caches pages you've visited, so a recipe you opened earlier still loads with no signal. |
| **Keep screen on** | Button on every recipe. Stops the screen dimming mid-method. (Chrome/Edge/Android and Safari 16.4+.) |
| **Scale** | `−` / `+` rescales every ingredient quantity, from ½× to 4×. Handles fractions — `1/2 tsp` at 1.5× becomes `¾ tsp`. |
| **Tick as you go** | Tap ingredients and steps to cross them off. Remembered per recipe, even if you close the tab. |
| **Search** | Searches titles, descriptions, tags **and ingredients** — so "what can I do with lemons" works. |
| **Dark mode** | Follows your phone's setting. |

---

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:8080. It live-reloads as you edit.

```bash
npm run build     # production build into _site/
npm run clean     # remove _site/
```

Node 20 or newer.

---

## How deploying works

`.github/workflows/deploy.yml` runs on every push to `main`:

1. `npm ci` and `npm run build`
2. Uploads `_site/` as a Pages artifact
3. Deploys it to GitHub Pages

The workflow reads the site's base path from the Pages configuration and passes
it in as `PATH_PREFIX`, so all links work under `/my-recipes/`. If you ever
rename the repo — or move it to `superlalapa.github.io` — the links follow
automatically, no edits needed.

Pages needs to be set to **Build and deployment → Source: GitHub Actions**. The
workflow attempts to set that itself on the first run; if it doesn't take, set
it by hand in **Settings → Pages**.

---

## Layout

```
recipes/            your recipes — the only folder you normally touch
_includes/layouts/  page templates
_data/site.js       site title, tagline, description
assets/             stylesheet, client-side JS, icons
lib/util.js         category naming helpers
scripts/            new-recipe scaffold, icon generator
eleventy.config.js  build config
```

Built with [Eleventy](https://www.11ty.dev/). One dependency, no framework.
