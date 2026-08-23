# Superlalapa's Recipes

A personal recipe collection in **English and Spanish**. Drop a Markdown file
into a folder under `recipes/`, push, and it's on your phone a minute later.

**Live site:** https://superlalapa.github.io/my-recipes/ · [Español](https://superlalapa.github.io/my-recipes/es/)

The site is marked `noindex` and ships a `robots.txt` that disallows crawling.
(On a GitHub Pages *project* site only the domain root's `robots.txt` is
honoured, so the `noindex` meta tag on every page is what actually does the
work.)

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

That creates `recipes/mains/thai-green-curry.md` from a template. Add `--es`
for the Spanish counterpart:

```bash
npm run new -- "Curry verde tailandés" mains --es
```

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
calories: "320"
protein: 27 g
tags: [thai, spicy, weeknight]
image: curry.jpg          # optional, sits next to the .md file
source: https://…         # optional, rendered as a link
sourceName: Bon Appétit   # optional; used alone if there's no URL
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

A heading containing **Ingredients / Ingredientes** turns the list under it
into tickable checkboxes. A heading containing **Method, Steps, Instructions,
Directions / Preparación, Elaboración, Pasos, Instrucciones** turns its list
into numbered, tickable steps. If a recipe has no headings at all, the first
bullet list and first numbered list are used instead — but if it *does* have
headings, nothing is guessed, so a list under "Notes" is left alone.

---

## Two languages

**The filename carries the language.** English is the default and lives at the
root; Spanish gets a `.es` suffix and a `/es/` URL:

```
recipes/mains/arroz-tapado.md      →  /recipes/mains/arroz-tapado/
recipes/mains/arroz-tapado.es.md   →  /es/recipes/mains/arroz-tapado/
```

The two files are linked automatically by their shared filename stem, so the
language switch button in the header goes straight to the counterpart.

A recipe with no translation still appears in **both** language listings — the
entry links to whichever version exists and carries a small `EN` / `ES` badge.
So you can add the translation later without leaving a hole in the site.

Interface strings, category names and both search indexes live in
[`_data/i18n.js`](_data/i18n.js). To add a language, add one entry there —
`LANGS`, the URL prefixes, the search indexes and the service worker precache
list are all derived from it.

---

## Categories

**The folder is the category.** No configuration, no registration step:

```
recipes/
├── breakfast/    desserts/     mains/      sauces/
├── sides/        smoothies/    snacks/     soups/     drinks/
```

Create a new folder and it appears on both home pages on the next build, with
its name title-cased and an emoji picked automatically. To control the display
name and icon, add the folder slug to the `categories` map of **each** language
in [`_data/i18n.js`](_data/i18n.js):

```js
categories: { sides: "Sides & Salads", … }   // en
categories: { sides: "Guarniciones y ensaladas", … }   // es
```

### Photos

Put the image file next to the recipe and reference it by filename. Both
language versions share the one photo:

```
recipes/mains/arroz-tapado.md      →  image: arroz.jpg
recipes/mains/arroz.jpg
```

---

## On your phone

| Feature | What it does |
| --- | --- |
| **Add to Home Screen** | Installs it like an app — full screen, own icon. Safari: Share → Add to Home Screen. Chrome: ⋮ → Add to Home screen. |
| **Works offline** | A service worker caches pages you've visited, so a recipe you opened earlier still loads with no signal. |
| **Keep screen on** | Button on every recipe. Stops the screen dimming mid-method. (Chrome/Edge/Android and Safari 16.4+.) |
| **Scale** | `−` / `+` rescales every ingredient quantity, from ½× to 4×. Handles fractions — `1/2 tsp` at 1.5× becomes `¾ tsp`. |
| **Tick as you go** | Tap ingredients and steps to cross them off. Remembered per recipe, keyed on the item's text so editing the recipe doesn't scramble your ticks. |
| **Search** | Searches titles, descriptions, tags **and ingredients**, in the language you're browsing. |
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

Pages must be set to **Settings → Pages → Build and deployment → Source:
GitHub Actions**. The workflow cannot turn that on for you; `GITHUB_TOKEN`
isn't allowed to create a Pages site.

---

## Layout

```
recipes/            your recipes — the only folder you normally touch
_data/i18n.js       every interface string, in both languages
_data/site.js       deploy identity (origin, repo) only
_includes/layouts/  page templates
assets/             stylesheet, client-side JS, icons
lib/util.js         language + category helpers
scripts/            new-recipe scaffold, icon generator
eleventy.config.js  build config and collections
```

Built with [Eleventy](https://www.11ty.dev/). One dependency, no framework.
