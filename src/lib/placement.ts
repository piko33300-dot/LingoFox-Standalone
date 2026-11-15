import {
  builder,
  listen,
  mc,
  type BuilderQuestion,
  type CourseId,
  type ListenQuestion,
  type Localized,
  type MCQuestion,
  type Question,
} from "./course-kit";
import { getCourse } from "./lessons";

export type PlacementLevel = "beginner" | "elementary" | "intermediate" | "advanced";

export type PlacementResult = {
  courseId: CourseId;
  score: number;
  total: number;
  level: PlacementLevel;
  levelLabel: Localized;
  levelDesc: Localized;
  targetUnitIndex: number;
  targetUnitTitle: Localized;
  skippedUnitsCount: number;
  bonusXp: number;
};

// Graded diagnostic suites for each language
const ENGLISH_PLACEMENT: Question[] = [
  // Level 1: Basics (A1.1)
  mc("the cat", "القطة", [
    ["الكلب", "🐶"],
    ["القطة", "🐱"],
    ["السمكة", "🐟"],
    ["الطائر", "🐦"],
  ]),
  // Level 1: Greetings (A1.1)
  builder("Good morning, how are you", "صباح الخير كيف حالك", ["أين", "من", "شكرا", "وداعا"]),
  // Level 2: Food & Everyday (A1.2)
  mc("I would like water, please", "أريد ماء من فضلك", [
    ["أريد ماء من فضلك", "💧"],
    ["أنا آكل الخبز الآن", "🍞"],
    ["أين محطة القطار", "🚉"],
    ["شكراً جزيلاً لك", "🙏"],
  ]),
  // Level 2: Simple Sentence (A1.2)
  builder("The boy drinks milk every morning", "الولد يشرب الحليب كل صباح", ["البنت", "تأكل", "مساء", "الماء"]),
  // Level 3: Travel & Directions (A2)
  mc("Where is the nearest hotel?", "أين أقرب فندق؟", [
    ["أين أقرب فندق؟", "🏨"],
    ["متى يفتح المطعم؟", "🍽️"],
    ["كم سعر هذه التذكرة؟", "🎟️"],
    ["هل المطار بعيد؟", "✈️"],
  ]),
  // Level 3: Family & Professions (A2)
  builder("My sister works at the hospital", "أختي تعمل في المستشفى", ["أخي", "يسكن", "المدرسة", "هنا"]),
  // Level 4: Time & Transportation (B1)
  mc("The train departs in fifteen minutes", "يغادر القطار خلال خمس عشرة دقيقة", [
    ["يغادر القطار خلال خمس عشرة دقيقة", "🚆"],
    ["وصلت الحافلة متأخرة ساعة", "🚌"],
    ["أنا أبحث عن حقيبتي", "🧳"],
    ["الطقس لطيف هذا الصباح", "☀️"],
  ]),
  // Level 4: Complex sentence (B1)
  builder("I can speak English well", "أنا أتحدث الإنجليزية بشكل جيد", ["هو", "يتعلم", "اللغة", "الفرنسية"]),
];

const SPANISH_PLACEMENT: Question[] = [
  mc("el gato", "القط", [["الكلب", "🐶"], ["القط", "🐱"], ["الماء", "💧"], ["الخبز", "🍞"]]),
  builder("Buenos días, cómo estás", "صباح الخير كيف حالك", ["شكرا", "من", "أين", "نعم"]),
  mc("Yo quiero agua, por favor", "أنا أريد ماء من فضلك", [["أنا أريد ماء من فضلك", "💧"], ["أنا آكل تفاحة", "🍎"], ["مع السلامة", "👋"], ["صباح النور", "☀️"]]),
  builder("La mujer bebe leche", "المرأة تشرب الحليب", ["الرجل", "يأكل", "الخبز", "هنا"]),
  mc("¿Dónde está el hotel?", "أين الفندق؟", [["أين الفندق؟", "🏨"], ["كم الساعة الآن؟", "⏰"], ["أين المطار؟", "✈️"], ["من أنت؟", "👤"]]),
  builder("Mi hermana vive aquí", "أختي تعيش هنا", ["أخي", "يعمل", "هناك", "نحن"]),
];

const FRENCH_PLACEMENT: Question[] = [
  mc("le chat", "القط", [["الكلب", "🐶"], ["القط", "🐱"], ["التفاحة", "🍎"], ["الماء", "💧"]]),
  builder("Bonjour, comment ça va", "صباح الخير كيف حالك", ["مساء", "وداعا", "شكرا", "أين"]),
  mc("Je voudrais de l'eau, s'il vous plaît", "أريد ماء من فضلك", [["أريد ماء من فضلك", "💧"], ["أنا آكل الخبز", "🍞"], ["أين المحطة", "🚉"], ["شكراً لك", "🙏"]]),
  builder("La femme boit du lait", "المرأة تشرب الحليب", ["الرجل", "يأكل", "العصير", "نحن"]),
  mc("Où est la gare?", "أين المحطة؟", [["أين المحطة؟", "🚉"], ["أين الفندق؟", "🏨"], ["متى نصل؟", "⏱️"], ["من فضلك", "🙏"]]),
  builder("Je parle un peu français", "أنا أتحدث الفرنسية قليلاً", ["هو", "يتعلم", "كثيراً", "هنا"]),
];

const GERMAN_PLACEMENT: Question[] = [
  mc("die Katze", "القطة", [["الكلب", "🐶"], ["القطة", "🐱"], ["الماء", "💧"], ["الخبز", "🍞"]]),
  builder("Guten Morgen, wie geht es dir", "صباح الخير كيف حالك", ["مساء", "وداعا", "شكرا", "نعم"]),
  mc("Ich möchte Wasser, bitte", "أريد ماء من فضلك", [["أريد ماء من فضلك", "💧"], ["أنا آكل تفاحة", "🍎"], ["أين القطار", "🚆"], ["شكراً جزيلاً", "🙏"]]),
  builder("Die Frau trinkt Milch", "المرأة تشرب الحليب", ["الرجل", "يأكل", "الخبز", "هنا"]),
  mc("Wo ist der Bahnhof?", "أين محطة القطار؟", [["أين محطة القطار؟", "🚉"], ["أين الفندق؟", "🏨"], ["كم التذكرة؟", "🎟️"], ["صباح الخير", "☀️"]]),
  builder("Ich lerne Deutsch gern", "أنا أحب تعلم الألمانية", ["هو", "يتحدث", "العربية", "سريعاً"]),
];

const ITALIAN_PLACEMENT: Question[] = [
  mc("il gatto", "القط", [["الكلب", "🐶"], ["القط", "🐱"], ["الماء", "💧"], ["الخبز", "🍞"]]),
  builder("Buongiorno, come stai", "صباح الخير كيف حالك", ["مساء", "وداعا", "شكرا", "نعم"]),
  mc("Vorrei dell'acqua, per favore", "أريد ماء من فضلك", [["أريد ماء من فضلك", "💧"], ["أنا آكل بيتزا", "🍕"], ["أين المطعم", "🍽️"], ["شكراً لك", "🙏"]]),
  builder("La donna beve latte", "المرأة تشرب الحليب", ["الرجل", "يأكل", "الخبز", "هنا"]),
  mc("Dov'è la stazione?", "أين المحطة؟", [["أين المحطة؟", "🚉"], ["أين الفندق؟", "🏨"], ["كم الحساب؟", "💶"], ["أهلاً وسهلاً", "👋"]]),
  builder("Parlo un po' di italiano", "أنا أتحدث الإيطالية قليلاً", ["هو", "يسكن", "هنا", "دائماً"]),
];

const TURKISH_PLACEMENT: Question[] = [
  mc("kedi", "قطة", [["كلب", "🐶"], ["قطة", "🐱"], ["ماء", "💧"], ["خبز", "🍞"]]),
  builder("Günaydın, nasılsın", "صباح الخير كيف حالك", ["مساء", "وداعا", "شكرا", "أين"]),
  mc("Su istiyorum, lütfen", "أريد ماء من فضلك", [["أريد ماء من فضلك", "💧"], ["أنا آكل خبزاً", "🍞"], ["أين الفندق", "🏨"], ["مع السلامة", "👋"]]),
  builder("Kadın süt içiyor", "المرأة تشرب الحليب", ["الرجل", "يأكل", "التفاح", "هنا"]),
  mc("Otel nerede?", "أين الفندق؟", [["أين الفندق؟", "🏨"], ["كم الساعة؟", "⏰"], ["أين المطار؟", "✈️"], ["مرحباً بكم", "👋"]]),
  builder("Biraz Türkçe konuşuyorum", "أنا أتحدث التركية قليلاً", ["هو", "يتعلم", "العربية", "جداً"]),
];

const ARABIC_PLACEMENT: Question[] = [
  mc("قطة", "cat", [["dog", "🐶"], ["cat", "🐱"], ["water", "💧"], ["bread", "🍞"]]),
  builder("صباح الخير كيف حالك", "Good morning how are you", ["where", "thanks", "yes", "goodbye"]),
  mc("أريد ماء من فضلك", "I want water please", [["I want water please", "💧"], ["I eat bread", "🍞"], ["Where is the train", "🚆"], ["Thank you", "🙏"]]),
  builder("المرأة تشرب الحليب", "The woman drinks milk", ["man", "eats", "bread", "here"]),
  mc("أين الفندق؟", "Where is the hotel?", [["Where is the hotel?", "🏨"], ["What time is it?", "⏰"], ["Where is the airport?", "✈️"], ["Welcome", "👋"]]),
  builder("أنا أتحدث العربية جيداً", "I speak Arabic well", ["he", "learns", "French", "very"]),
];

export function getPlacementQuestions(courseId: CourseId): Question[] {
  switch (courseId) {
    case "en": return ENGLISH_PLACEMENT;
    case "es": return SPANISH_PLACEMENT;
    case "fr": return FRENCH_PLACEMENT;
    case "de": return GERMAN_PLACEMENT;
    case "it": return ITALIAN_PLACEMENT;
    case "tr": return TURKISH_PLACEMENT;
    case "ar": return ARABIC_PLACEMENT;
    default: return ENGLISH_PLACEMENT;
  }
}

export function evaluatePlacement(courseId: CourseId, score: number, total: number): PlacementResult {
  const course = getCourse(courseId) ?? getCourse("en")!;
  const unitsCount = course.units.length;
  const ratio = total > 0 ? score / total : 0;

  let level: PlacementLevel = "beginner";
  let rawTargetIndex = 0;
  let bonusXp = 30;

  if (ratio >= 0.85) {
    level = "advanced";
    rawTargetIndex = 6;
    bonusXp = 150;
  } else if (ratio >= 0.6) {
    level = "intermediate";
    rawTargetIndex = 4;
    bonusXp = 100;
  } else if (ratio >= 0.35) {
    level = "elementary";
    rawTargetIndex = 2;
    bonusXp = 60;
  } else {
    level = "beginner";
    rawTargetIndex = 0;
    bonusXp = 30;
  }

  // Safe clamping to the course's available units
  const targetUnitIndex = Math.min(rawTargetIndex, Math.max(0, unitsCount - 1));
  const skippedUnitsCount = targetUnitIndex;
  const targetUnit = course.units[targetUnitIndex] ?? course.units[0]!;

  const levelLabel: Localized = {
    ar: level === "beginner" ? "مبتدئ (Beginner - A1)"
      : level === "elementary" ? "مبتدئ متقدم (Elementary - A2)"
      : level === "intermediate" ? "متوسط (Intermediate - B1)"
      : "متقدم (Advanced - B2)",
    en: level === "beginner" ? "Beginner (A1)"
      : level === "elementary" ? "Elementary (A2)"
      : level === "intermediate" ? "Intermediate (B1)"
      : "Advanced (B2)",
  };

  const levelDesc: Localized = {
    ar: level === "beginner" ? "ستبدأ من الأساسيات لتثبيت الحروف والمفردات الأولى."
      : level === "elementary" ? "لديك قاعدة جيدة! سنتخطى البدايات ونبدأ بمحادثات الحياة اليومية."
      : level === "intermediate" ? "مستواك رائع! تم فتح الوحدات الأولى وستنطلق في مواضيع السفر والعمل."
      : "أداء متميز واستثنائي! تم فتح معظم المسار لتنطلق مباشرة في القواعد المتقدمة.",
    en: level === "beginner" ? "You will start from basics to build solid vocabulary."
      : level === "elementary" ? "Solid foundation! We skip initial basics and jump to everyday life."
      : level === "intermediate" ? "Great level! Early units unlocked so you jump to travel and work topics."
      : "Exceptional mastery! Most early units unlocked to start with advanced conversation.",
  };

  return {
    courseId,
    score,
    total,
    level,
    levelLabel,
    levelDesc,
    targetUnitIndex,
    targetUnitTitle: targetUnit.title,
    skippedUnitsCount,
    bonusXp,
  };
}
