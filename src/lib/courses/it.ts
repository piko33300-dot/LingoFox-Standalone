import { beginnerUnits, builder, listen, match, mc, typeTarget, unit, type Course } from "../course-kit";

// Learn Italian (for Arabic speakers). Pairs in match() are [target, native].
export const ITALIAN: Course = {
  id: "it",
  target: "it",
  native: "ar",
  flag: "🇮🇹",
  title: { ar: "الإيطالية", en: "Italian" },
  subtitle: { ar: "للناطقين بالعربية", en: "For Arabic speakers" },
  units: [
    unit("it", "basics", { ar: "الأساسيات", en: "Basics" }, { ar: "أول كلماتك بالإيطالية", en: "Your first Italian words" }, [
      mc("il ragazzo", "الولد", [["الولد", "👦"], ["البنت", "👧"], ["الرجل", "👨"], ["المرأة", "👩"]]),
      listen("la ragazza", ["la ragazza", "il ragazzo", "la donna", "l'uomo"]),
      builder("Io sono un ragazzo", "أنا ولد", ["ragazza", "tu", "lui"]),
      mc("il gatto", "القطة", [["الكلب", "🐶"], ["القطة", "🐱"], ["العصفور", "🐦"], ["السمكة", "🐟"]]),
      typeTarget("it", "كلب", "cane", "il cane", "un cane"),
      match([["ragazzo", "ولد"], ["ragazza", "بنت"], ["gatto", "قطة"], ["cane", "كلب"]]),
      builder("La donna beve acqua", "المرأة تشرب الماء", ["L'uomo", "mangia", "latte"]),
      listen("acqua", ["acqua", "latte", "pane", "mela"]),
      typeTarget("it", "رجل", "uomo", "l'uomo", "un uomo"),
    ]),
    ...beginnerUnits("it", [
      {
        words: [
          "ciao", "arrivederci", "grazie", "per favore",
          "sì", "no", "scusa", "buonanotte",
        ],
        sentences: ["Buongiorno", "Come stai?"],
      },
      {
        words: [
          "la mela", "il caffè", "il riso", "il pane",
          "il latte", "la carne", "il pesce", "il formaggio",
        ],
        sentences: ["Io mangio pane", "Lei vuole la pizza"],
      },
      {
        words: [
          "la madre", "il padre", "la sorella", "il fratello",
          "la famiglia", "il bambino", "la nonna", "il nonno",
        ],
        sentences: ["Questo è mio fratello", "Io amo la mia famiglia"],
      },
      {
        words: [
          "il treno", "la spiaggia", "l'aeroporto", "l'hotel",
          "la macchina", "il biglietto", "l'aereo", "il passaporto",
        ],
        sentences: ["Dov'è l'hotel?", "Ho bisogno di un taxi"],
      },
      {
        words: [
          "rosso", "tre", "cinque", "blu",
          "verde", "giallo", "uno", "due",
        ],
        sentences: ["Ho tre libri", "La macchina è rossa"],
      },
      {
        words: [
          "legge", "scrive", "dorme", "lavora",
          "mangia", "beve", "va", "viene",
        ],
        sentences: ["Io leggo un libro", "Lui lavora oggi"],
      },
      {
        words: [
          "la scuola", "l'ospedale", "il parco", "il ristorante",
          "il mercato", "la banca", "la farmacia", "la biblioteca",
        ],
        sentences: ["Dov'è l'ospedale?", "Sono al parco"],
      },
    ]),
  ],
};
