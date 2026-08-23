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

const argv = process.argv.slice(2);
const spanish = argv.includes("--es");
const [title, categoryArg] = argv.filter((a) => !a.startsWith("--"));

if (!title) {
  const existing = readdirSync(RECIPES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  console.error('Usage: npm run new -- "Recipe title" [category] [--es]');
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
const file = join(dir, `${slug}${spanish ? ".es" : ""}.md`);

if (existsSync(file)) {
  console.error(`Already exists: recipes/${category}/${slug}${spanish ? ".es" : ""}.md`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const headings = spanish
  ? ["Ingredientes", "Preparación", "Notas"]
  : ["Ingredients", "Method", "Notes"];

const sample = spanish
  ? ["- 1 cosa", "- 200 g de otra cosa", "1. Haz lo primero.", "2. Luego lo siguiente.",
     "Lo que merezca la pena recordar para la próxima."]
  : ["- 1 thing", "- 200 g another thing", "1. Do the first thing.", "2. Then the next thing.",
     "Anything worth remembering next time."];

// JSON string syntax is valid YAML flow scalar syntax, so a title
// containing `:`, `#`, or quotes still parses.
const template = `---
title: ${JSON.stringify(title)}
description:
date: ${today}
servings: 4
prep: 10 min
cook: 20 min
tags: []
---

## ${headings[0]}

${sample[0]}
${sample[1]}

## ${headings[1]}

${sample[2]}
${sample[3]}

## ${headings[2]}

${sample[4]}
`;

mkdirSync(dir, { recursive: true });
writeFileSync(file, template);
console.log(`Created recipes/${category}/${slug}${spanish ? ".es" : ""}.md`);
console.log(`It will publish at ${spanish ? "/es" : ""}/recipes/${category}/${slug}/`);
