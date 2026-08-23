/**
 * Scaffold a recipe file.
 *   npm run new -- "Thai Green Curry" mains
 *   npm run new -- "Overnight Oats"            (defaults to the mains folder)
 */
import { writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RECIPES = join(ROOT, "recipes");

const [title, categoryArg] = process.argv.slice(2);

if (!title) {
  const existing = readdirSync(RECIPES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  console.error('Usage: npm run new -- "Recipe title" [category]');
  console.error(`Existing categories: ${existing.join(", ") || "(none yet)"}`);
  process.exit(1);
}

const slugify = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const category = slugify(categoryArg || "mains");
const slug = slugify(title);

if (!slug) {
  console.error("That title doesn't produce a usable filename.");
  process.exit(1);
}

const dir = join(RECIPES, category);
const file = join(dir, `${slug}.md`);

if (existsSync(file)) {
  console.error(`Already exists: recipes/${category}/${slug}.md`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const template = `---
title: ${title}
description:
date: ${today}
servings: 4
prep: 10 min
cook: 20 min
tags: []
---

## Ingredients

- 1 thing
- 200 g another thing

## Method

1. Do the first thing.
2. Then the next thing.

## Notes

Anything worth remembering next time.
`;

mkdirSync(dir, { recursive: true });
writeFileSync(file, template);
console.log(`Created recipes/${category}/${slug}.md`);
console.log(`It will publish at /recipes/${category}/${slug}/`);
