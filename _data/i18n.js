/**
 * UI strings and per-language metadata.
 *
 * Placeholders are plain `{n}` / `{tag}` tokens, substituted in templates with
 * Nunjucks' `replace` filter, so the data stays serialisable.
 */
const en = {
  code: "en",
  name: "English",
  home: "/",
  htmlLang: "en",

  siteTitle: "Superlalapa's Recipes",
  tagline: "The ones worth cooking twice.",
  siteDescription: "A personal, mobile-friendly recipe collection.",

  navHome: "Home",
  navAll: "All recipes",
  navSource: "Source",

  skipToContent: "Skip to content",
  searchOpen: "Search recipes",
  searchPlaceholder: "Search recipes, ingredients, tags…",
  searchClose: "Close",
  searchEmpty: "Nothing matched. Try an ingredient.",
  searchCta: "Search {n} recipes",

  homeCategories: "Categories",
  homeRecent: "Recently added",
  homeTags: "Tags",
  homeAllLink: "All recipes →",

  allTitle: "All recipes",
  allCount: "{n} in the collection.",

  countOne: "{n} recipe",
  countMany: "{n} recipes",
  backHome: "← Home",

  tagTitle: "Tagged “{tag}”",

  factServes: "Serves",
  factPrep: "Prep",
  factCook: "Cook",
  factTotal: "Total",
  factLevel: "Level",
  factCalories: "Calories",
  factProtein: "Protein",

  scaleLabel: "Scale",
  scaleDown: "Fewer servings",
  scaleUp: "More servings",
  keepAwake: "Keep screen on",
  resetTicks: "Reset ticks",

  editOnGitHub: "Edit this recipe on GitHub",
  adaptedFrom: "Adapted from",
  sourceFrom: "From",

  notFoundTitle: "Nothing on this shelf",
  notFoundLede: "That recipe doesn’t exist — or hasn’t been written down yet.",
  notFoundBack: "← Back to the collection",

  switchTo: "Ver en español",
  untranslated: "Not available in English yet — showing the Spanish original.",

  categories: {
    breakfast: "Breakfast",
    mains: "Mains",
    sides: "Sides & Salads",
    desserts: "Desserts",
    smoothies: "Smoothies",
    soups: "Soups",
    snacks: "Snacks",
    sauces: "Sauces",
    drinks: "Drinks",
  },
};

const es = {
  code: "es",
  name: "Español",
  home: "/es/",
  htmlLang: "es",

  siteTitle: "Las recetas de Superlalapa",
  tagline: "Las que vale la pena cocinar dos veces.",
  siteDescription: "Una colección personal de recetas, pensada para el móvil.",

  navHome: "Inicio",
  navAll: "Todas las recetas",
  navSource: "Código",

  skipToContent: "Saltar al contenido",
  searchOpen: "Buscar recetas",
  searchPlaceholder: "Busca recetas, ingredientes, etiquetas…",
  searchClose: "Cerrar",
  searchEmpty: "No hay resultados. Prueba con un ingrediente.",
  searchCta: "Buscar en {n} recetas",

  homeCategories: "Categorías",
  homeRecent: "Añadidas recientemente",
  homeTags: "Etiquetas",
  homeAllLink: "Todas las recetas →",

  allTitle: "Todas las recetas",
  allCount: "{n} en la colección.",

  countOne: "{n} receta",
  countMany: "{n} recetas",
  backHome: "← Inicio",

  tagTitle: "Etiquetadas «{tag}»",

  factServes: "Raciones",
  factPrep: "Preparación",
  factCook: "Cocción",
  factTotal: "Total",
  factLevel: "Nivel",
  factCalories: "Calorías",
  factProtein: "Proteína",

  scaleLabel: "Escalar",
  scaleDown: "Menos raciones",
  scaleUp: "Más raciones",
  keepAwake: "Mantener pantalla encendida",
  resetTicks: "Reiniciar marcas",

  editOnGitHub: "Editar esta receta en GitHub",
  adaptedFrom: "Adaptada de",
  sourceFrom: "De",

  notFoundTitle: "No hay nada en este estante",
  notFoundLede: "Esa receta no existe — o todavía no está escrita.",
  notFoundBack: "← Volver a la colección",

  switchTo: "View in English",
  untranslated: "Aún sin traducir — se muestra la versión en inglés.",

  categories: {
    breakfast: "Desayuno",
    mains: "Platos principales",
    sides: "Guarniciones y ensaladas",
    desserts: "Postres",
    smoothies: "Batidos",
    soups: "Sopas",
    snacks: "Snacks",
    sauces: "Salsas",
    drinks: "Bebidas",
  },
};

en.other = "es";
es.other = "en";

export default { strings: { en, es }, list: [en, es] };
