// Building blocks shared by every course file (types + question helpers).
/** Languages a course can teach or be taught in. */
export type LangCode = "en" | "ar" | "es" | "fr" | "tr" | "de";
/** Interface languages (i18n dictionaries). */
export type UiLang = "en" | "ar";
export type Localized = { ar: string; en: string };

export type MCQuestion = {
  type: "mc";
  word: string; // target language
  hint?: string | undefined; // transliteration
  options: { text: string; emoji: string }[]; // native language
  answer: string;
};
export type BuilderQuestion = {
  type: "builder";
  sentence: string; // target language
  answer: string[]; // native-language words
  bank: string[];
};
export type ListenQuestion = {
  type: "listen";
  text: string; // spoken in target language
  options: string[]; // target language
  answer: string;
};
export type TypeQuestion = {
  type: "type";
  show: string;
  showLang: LangCode;
  answerLang: LangCode;
  accepted: string[];
};
export type MatchQuestion = {
  type: "match";
  pairs: [string, string][]; // [target, native]
};
export type Question = MCQuestion | BuilderQuestion | ListenQuestion | TypeQuestion | MatchQuestion;

export type Unit = {
  id: string;
  title: Localized;
  description: Localized;
  lessons: string[];
  questions: Question[];
};

export type CourseId = "en" | "ar" | "es" | "fr" | "tr" | "de";
export const COURSE_IDS: CourseId[] = ["en", "ar", "es", "fr", "tr", "de"];
export type Course = {
  id: CourseId;
  target: LangCode;
  native: LangCode;
  flag: string;
  title: Localized;
  subtitle: Localized;
  units: Unit[];
};

export const mc = (word: string, answer: string, options: [string, string][], hint?: string): MCQuestion => ({
  type: "mc",
  word,
  hint,
  answer,
  options: options.map(([text, emoji]) => ({ text, emoji })),
});
export const builder = (sentence: string, answer: string, extra: string[]): BuilderQuestion => {
  const words = answer.split(" ");
  return { type: "builder", sentence, answer: words, bank: [...words, ...extra].sort((a, b) => a.localeCompare(b)) };
};
export const listen = (text: string, options: string[]): ListenQuestion => ({
  type: "listen",
  text,
  answer: text,
  options: [...options].sort((a, b) => a.localeCompare(b)),
});
export const match = (pairs: [string, string][]): MatchQuestion => ({ type: "match", pairs });

export function unit(courseId: CourseId, id: string, title: Localized, description: Localized, questions: Question[]): Unit {
  return { id: `${courseId}-${id}`, title, description, questions, lessons: [1, 2, 3].map((n) => `${courseId}-${id}-${n}`) };
}


/** Type the target-language word for a native (Arabic) prompt. */
export const typeTarget = (target: LangCode, show: string, ...accepted: string[]): TypeQuestion => ({ type: "type", show, showLang: "ar", answerLang: target, accepted });

// ---------- Shared beginner path for Latin-script courses (for Arabic speakers) ----------
const LEADING_WORDS = /^(el|la|los|las|un|una|le|les|une|il|elle|der|die|das|ein|eine|er|sie|bir)\s+|^l'/i;
/** Accept a typed answer with or without its article/pronoun ("el pan" or "pan"). */
function variants(word: string): string[] {
  const bare = word.replace(LEADING_WORDS, "").trim();
  return bare && bare !== word ? [word, bare] : [word];
}

type BeginnerTranslation = {
  words: [string, string, string, string, string, string, string, string];
  sentences: [string, string];
};

export function beginnerUnits(
  code: Course["target"],
  translations: BeginnerTranslation[],
) {
  const themes: {
    id: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    vocabulary: [string, string][];
    answers: [string, string];
    extras: [string[], string[]];
  }[] = [
    {
      id: "greetings",
      title: { ar: "التحيات", en: "Greetings" },
      description: {
        ar: "تعلّم التحية والوداع وكلمات المجاملة",
        en: "Learn greetings, goodbyes, and polite words",
      },
      vocabulary: [
        ["مرحبا", "👋"],
        ["وداعا", "🙋"],
        ["شكرا", "🙏"],
        ["من فضلك", "🥺"],
        ["نعم", "👍"],
        ["لا", "👎"],
        ["آسف", "😔"],
        ["تصبح على خير", "🌙"],
      ],
      answers: ["صباح الخير", "كيف حالك"],
      extras: [["مساء", "ليلة", "شكرا"], ["أين", "من", "أنا"]],
    },
    {
      id: "food",
      title: { ar: "الطعام", en: "Food" },
      description: {
        ar: "تعرّف على الطعام والشراب وعبّر عما تريد",
        en: "Learn food and drinks and say what you want",
      },
      vocabulary: [
        ["التفاحة", "🍎"],
        ["القهوة", "☕"],
        ["الأرز", "🍚"],
        ["الخبز", "🍞"],
        ["الحليب", "🥛"],
        ["اللحم", "🥩"],
        ["السمك", "🐟"],
        ["الجبن", "🧀"],
      ],
      answers: ["أنا آكل الخبز", "هي تريد بيتزا"],
      extras: [["أنت", "تشرب", "التفاحة"], ["هو", "يأكل", "حساء"]],
    },
    {
      id: "family",
      title: { ar: "العائلة", en: "Family" },
      description: {
        ar: "تحدّث عن أفراد عائلتك",
        en: "Talk about your family members",
      },
      vocabulary: [
        ["الأم", "👩"],
        ["الأب", "👨"],
        ["الأخت", "👧"],
        ["الأخ", "👦"],
        ["العائلة", "👨‍👩‍👧‍👦"],
        ["الطفل الرضيع", "👶"],
        ["الجدة", "👵"],
        ["الجد", "👴"],
      ],
      answers: ["هذا أخي", "أنا أحب عائلتي"],
      extras: [["هذه", "أختي", "أمي"], ["أنت", "بيتي", "تحب"]],
    },
    {
      id: "travel",
      title: { ar: "السفر", en: "Travel" },
      description: {
        ar: "تعلّم كلمات السفر ووسائل النقل",
        en: "Learn travel words and transport",
      },
      vocabulary: [
        ["القطار", "🚆"],
        ["الشاطئ", "🏖️"],
        ["المطار", "✈️"],
        ["الفندق", "🏨"],
        ["السيارة", "🚗"],
        ["التذكرة", "🎫"],
        ["الطائرة", "🛫"],
        ["جواز السفر", "🛂"],
      ],
      answers: ["أين الفندق", "أحتاج سيارة أجرة"],
      extras: [["من", "الشاطئ", "متى"], ["أريد", "حافلة", "الفندق"]],
    },
    {
      id: "numbers",
      title: { ar: "الأرقام والألوان", en: "Numbers & colors" },
      description: {
        ar: "تعلّم العدّ ووصف الألوان",
        en: "Learn to count and describe colors",
      },
      vocabulary: [
        ["أحمر", "🔴"],
        ["ثلاثة", "3️⃣"],
        ["خمسة", "5️⃣"],
        ["أزرق", "🔵"],
        ["أخضر", "🟢"],
        ["أصفر", "🟡"],
        ["واحد", "1️⃣"],
        ["اثنان", "2️⃣"],
      ],
      answers: ["لدي ثلاثة كتب", "السيارة حمراء"],
      extras: [["خمسة", "أقلام", "أنت"], ["البيت", "أزرق", "كبيرة"]],
    },
    {
      id: "daily",
      title: { ar: "الحياة اليومية", en: "Daily life" },
      description: {
        ar: "تعلّم أفعال الأنشطة اليومية",
        en: "Learn verbs for everyday activities",
      },
      vocabulary: [
        ["يقرأ", "📖"],
        ["يكتب", "✍️"],
        ["ينام", "😴"],
        ["يعمل", "💼"],
        ["يأكل", "🍽️"],
        ["يشرب", "🥤"],
        ["يذهب", "🚶"],
        ["يأتي", "👋"],
      ],
      answers: ["أنا أقرأ كتابا", "هو يعمل اليوم"],
      extras: [["أنت", "تشرب", "رسالة"], ["هي", "غدا", "ينام"]],
    },
    {
      id: "city",
      title: { ar: "أماكن في المدينة", en: "Places in the city" },
      description: {
        ar: "تعرّف على أماكن المدينة واسأل عن موقعها",
        en: "Learn city places and ask where they are",
      },
      vocabulary: [
        ["المدرسة", "🏫"],
        ["المستشفى", "🏥"],
        ["الحديقة", "🌳"],
        ["المطعم", "🍽️"],
        ["السوق", "🛒"],
        ["المصرف", "🏦"],
        ["الصيدلية", "💊"],
        ["المكتبة", "📚"],
      ],
      answers: ["أين المستشفى", "أنا في الحديقة"],
      extras: [["متى", "المدرسة", "من"], ["أنت", "إلى", "المطعم"]],
    },
  ];

  return themes.map((theme, index) => {
    const { words, sentences } = translations[index]!;
    const options = theme.vocabulary.slice(0, 4) as [string, string][];
    const listeningOptions = words.slice(0, 4);

    return unit(code, theme.id, theme.title, theme.description, [
      mc(words[0], theme.vocabulary[0]![0], options),
      listen(words[1], listeningOptions),
      builder(sentences[0], theme.answers[0], theme.extras[0]),
      mc(words[2], theme.vocabulary[2]![0], options),
      typeTarget(code, theme.vocabulary[4]![0], ...variants(words[4])),
      match(
        words.slice(4).map(
          (word, offset): [string, string] => [
            word,
            theme.vocabulary[offset + 4]![0],
          ],
        ),
      ),
      builder(sentences[1], theme.answers[1], theme.extras[1]),
      listen(words[3], listeningOptions),
      typeTarget(code, theme.vocabulary[5]![0], ...variants(words[5])),
    ]);
  });
}
