import { beginnerUnits, builder, listen, match, mc, typeTarget, unit, type Course } from "../course-kit";

// Learn German (for Arabic speakers). Pairs in match() are [target, native].
export const GERMAN: Course = {
  id: "de",
  target: "de",
  native: "ar",
  flag: "🇩🇪",
  title: { ar: "الألمانية", en: "German" },
  subtitle: { ar: "للناطقين بالعربية", en: "For Arabic speakers" },
  units: [
    unit("de", "basics", { ar: "الأساسيات", en: "Basics" }, { ar: "أول كلماتك بالألمانية", en: "Your first German words" }, [
      mc("der Junge", "الولد", [["الولد", "👦"], ["البنت", "👧"], ["الرجل", "👨"], ["المرأة", "👩"]]),
      listen("das Mädchen", ["das Mädchen", "der Junge", "die Frau", "der Mann"]),
      builder("Ich bin ein Junge", "أنا ولد", ["بنت", "أنت", "هو"]),
      mc("die Katze", "القطة", [["الكلب", "🐶"], ["القطة", "🐱"], ["الطائر", "🐦"], ["السمكة", "🐟"]]),
      typeTarget("de", "كلب", "Hund", "der Hund", "ein Hund"),
      match([["Junge", "ولد"], ["Mädchen", "بنت"], ["Katze", "قطة"], ["Hund", "كلب"]]),
      builder("Die Frau trinkt Wasser", "المرأة تشرب الماء", ["الرجل", "يأكل", "الحليب"]),
      listen("Wasser", ["Wasser", "Milch", "Brot", "Saft"]),
      typeTarget("de", "رجل", "Mann", "der Mann", "ein Mann"),
    ]),
    ...beginnerUnits("de", [
      {
        words: [
          "hallo", "auf Wiedersehen", "danke", "bitte",
          "ja", "nein", "Entschuldigung", "gute Nacht",
        ],
        sentences: ["Guten Morgen", "Wie geht es dir?"],
      },
      {
        words: [
          "der Apfel", "der Kaffee", "der Reis", "das Brot",
          "die Milch", "das Fleisch", "der Fisch", "der Käse",
        ],
        sentences: ["Ich esse Brot", "Sie möchte eine Pizza"],
      },
      {
        words: [
          "die Mutter", "der Vater", "die Schwester", "der Bruder",
          "die Familie", "das Baby", "die Großmutter", "der Großvater",
        ],
        sentences: ["Das ist mein Bruder", "Ich liebe meine Familie"],
      },
      {
        words: [
          "der Zug", "der Strand", "der Flughafen", "das Hotel",
          "das Auto", "die Fahrkarte", "das Flugzeug", "der Reisepass",
        ],
        sentences: ["Wo ist das Hotel?", "Ich brauche ein Taxi"],
      },
      {
        words: [
          "rot", "drei", "fünf", "blau",
          "grün", "gelb", "eins", "zwei",
        ],
        sentences: ["Ich habe drei Bücher", "Das Auto ist rot"],
      },
      {
        words: [
          "er liest", "er schreibt", "er schläft", "er arbeitet",
          "er isst", "er trinkt", "er geht", "er kommt",
        ],
        sentences: ["Ich lese ein Buch", "Er arbeitet heute"],
      },
      {
        words: [
          "die Schule", "das Krankenhaus", "der Park", "das Restaurant",
          "der Markt", "die Bank", "die Apotheke", "die Bibliothek",
        ],
        sentences: ["Wo ist das Krankenhaus?", "Ich bin im Park"],
      },
    ]),
  ],
};
