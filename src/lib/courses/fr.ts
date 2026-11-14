import { beginnerUnits, builder, listen, match, mc, typeTarget, unit, type Course } from "../course-kit";

// Learn French (for Arabic speakers). Pairs in match() are [target, native].
export const FRENCH: Course = {
  id: "fr",
  target: "fr",
  native: "ar",
  flag: "🇫🇷",
  title: { ar: "الفرنسية", en: "French" },
  subtitle: { ar: "للناطقين بالعربية", en: "For Arabic speakers" },
  units: [
    unit("fr", "basics", { ar: "الأساسيات", en: "Basics" }, { ar: "أول كلماتك بالفرنسية", en: "Your first French words" }, [
      mc("le garçon", "الولد", [["الولد", "👦"], ["البنت", "👧"], ["الرجل", "👨"], ["المرأة", "👩"]]),
      listen("la fille", ["la fille", "le garçon", "la femme", "l'homme"]),
      builder("Je suis un garçon", "أنا ولد", ["بنت", "أنت", "هو"]),
      mc("le chat", "القطة", [["الكلب", "🐶"], ["القطة", "🐱"], ["الطائر", "🐦"], ["السمكة", "🐟"]]),
      typeTarget("fr", "كلب", "chien", "le chien", "un chien"),
      match([["garçon", "ولد"], ["fille", "بنت"], ["chat", "قطة"], ["chien", "كلب"]]),
      builder("La femme boit de l'eau", "المرأة تشرب الماء", ["الرجل", "يأكل", "الحليب"]),
      listen("eau", ["eau", "lait", "pain", "jus"]),
      typeTarget("fr", "رجل", "homme", "l'homme", "un homme"),
    ]),
    ...beginnerUnits("fr", [
      {
        words: [
          "bonjour", "au revoir", "merci", "s'il vous plaît",
          "oui", "non", "désolé", "bonne nuit",
        ],
        sentences: ["Bonjour à tous", "Comment vas-tu ?"],
      },
      {
        words: [
          "la pomme", "le café", "le riz", "le pain",
          "le lait", "la viande", "le poisson", "le fromage",
        ],
        sentences: ["Je mange du pain", "Elle veut une pizza"],
      },
      {
        words: [
          "la mère", "le père", "la sœur", "le frère",
          "la famille", "le bébé", "la grand-mère", "le grand-père",
        ],
        sentences: ["C'est mon frère", "J'aime ma famille"],
      },
      {
        words: [
          "le train", "la plage", "l'aéroport", "l'hôtel",
          "la voiture", "le billet", "l'avion", "le passeport",
        ],
        sentences: ["Où est l'hôtel ?", "J'ai besoin d'un taxi"],
      },
      {
        words: [
          "rouge", "trois", "cinq", "bleu",
          "vert", "jaune", "un", "deux",
        ],
        sentences: ["J'ai trois livres", "La voiture est rouge"],
      },
      {
        words: [
          "il lit", "il écrit", "il dort", "il travaille",
          "il mange", "il boit", "il va", "il vient",
        ],
        sentences: ["Je lis un livre", "Il travaille aujourd'hui"],
      },
      {
        words: [
          "l'école", "l'hôpital", "le parc", "le restaurant",
          "le marché", "la banque", "la pharmacie", "la bibliothèque",
        ],
        sentences: ["Où est l'hôpital ?", "Je suis dans le parc"],
      },
    ]),
  ],
};
