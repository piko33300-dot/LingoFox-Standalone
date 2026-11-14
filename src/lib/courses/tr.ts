import { beginnerUnits, builder, listen, match, mc, typeTarget, unit, type Course } from "../course-kit";

// Learn Turkish (for Arabic speakers). Pairs in match() are [target, native].
export const TURKISH: Course = {
  id: "tr",
  target: "tr",
  native: "ar",
  flag: "🇹🇷",
  title: { ar: "التركية", en: "Turkish" },
  subtitle: { ar: "للناطقين بالعربية", en: "For Arabic speakers" },
  units: [
    unit("tr", "basics", { ar: "الأساسيات", en: "Basics" }, { ar: "أول كلماتك بالتركية", en: "Your first Turkish words" }, [
      mc("erkek çocuk", "الولد", [["الولد", "👦"], ["البنت", "👧"], ["الرجل", "👨"], ["المرأة", "👩"]]),
      listen("kız", ["kız", "erkek", "kadın", "adam"]),
      builder("Ben bir çocuğum", "أنا طفل", ["بنت", "أنت", "هو"]),
      mc("kedi", "القطة", [["الكلب", "🐶"], ["القطة", "🐱"], ["الطائر", "🐦"], ["السمكة", "🐟"]]),
      typeTarget("tr", "كلب", "köpek", "bir köpek"),
      match([["çocuk", "طفل"], ["kız", "بنت"], ["kedi", "قطة"], ["köpek", "كلب"]]),
      builder("Kadın su içiyor", "المرأة تشرب الماء", ["الرجل", "يأكل", "الحليب"]),
      listen("su", ["su", "süt", "ekmek", "meyve suyu"]),
      typeTarget("tr", "رجل", "adam", "bir adam"),
    ]),
    ...beginnerUnits("tr", [
      {
        words: [
          "merhaba", "hoşça kal", "teşekkür ederim", "lütfen",
          "evet", "hayır", "özür dilerim", "iyi geceler",
        ],
        sentences: ["Günaydın", "Nasılsın?"],
      },
      {
        words: [
          "elma", "kahve", "pirinç", "ekmek",
          "süt", "et", "balık", "peynir",
        ],
        sentences: ["Ben ekmek yiyorum", "O pizza istiyor"],
      },
      {
        words: [
          "anne", "baba", "kız kardeş", "erkek kardeş",
          "aile", "bebek", "büyükanne", "büyükbaba",
        ],
        sentences: ["Bu benim erkek kardeşim", "Ben ailemi seviyorum"],
      },
      {
        words: [
          "tren", "plaj", "havalimanı", "otel",
          "araba", "bilet", "uçak", "pasaport",
        ],
        sentences: ["Otel nerede?", "Bir taksiye ihtiyacım var"],
      },
      {
        words: [
          "kırmızı", "üç", "beş", "mavi",
          "yeşil", "sarı", "bir", "iki",
        ],
        sentences: ["Üç kitabım var", "Araba kırmızı"],
      },
      {
        words: [
          "okuyor", "yazıyor", "uyuyor", "çalışıyor",
          "yiyor", "içiyor", "gidiyor", "geliyor",
        ],
        sentences: ["Ben bir kitap okuyorum", "O bugün çalışıyor"],
      },
      {
        words: [
          "okul", "hastane", "park", "restoran",
          "pazar", "banka", "eczane", "kütüphane",
        ],
        sentences: ["Hastane nerede?", "Ben parktayım"],
      },
    ]),
  ],
};
