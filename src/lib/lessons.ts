// Static course content. Shape mirrors a future `courses` / `lessons` table.
import {
  builder,
  listen,
  match,
  mc,
  unit,
  type Course,
  type CourseId,
  type TypeQuestion,
  type BuilderQuestion,
} from "./course-kit";
import { SPANISH } from "./courses/es";
import { FRENCH } from "./courses/fr";
import { TURKISH } from "./courses/tr";
import { GERMAN } from "./courses/de";

export * from "./course-kit";

// ---------- Learn English (for Arabic speakers) ----------
const typeEn = (show: string, ...accepted: string[]): TypeQuestion => ({ type: "type", show, showLang: "ar", answerLang: "en", accepted });

const ENGLISH: Course = {
  id: "en",
  target: "en",
  native: "ar",
  flag: "🇬🇧",
  title: { ar: "الإنجليزية", en: "English" },
  subtitle: { ar: "للناطقين بالعربية", en: "For Arabic speakers" },
  units: [
    unit("en", "basics", { ar: "الأساسيات", en: "Basics" }, { ar: "أول كلماتك بالإنجليزية", en: "Your first English words" }, [
      mc("the boy", "الولد", [["الولد", "👦"], ["البنت", "👧"], ["الرجل", "👨"], ["المرأة", "👩"]]),
      listen("the girl", ["the girl", "the boy", "the woman", "the man"]),
      builder("I am a boy", "أنا ولد", ["بنت", "أنت", "هو"]),
      mc("the cat", "القطة", [["الكلب", "🐶"], ["القطة", "🐱"], ["الطائر", "🐦"], ["السمكة", "🐟"]]),
      typeEn("كلب", "dog", "a dog", "the dog"),
      match([["boy", "ولد"], ["girl", "بنت"], ["cat", "قطة"], ["dog", "كلب"]]),
      builder("The woman drinks water", "المرأة تشرب الماء", ["الرجل", "يأكل", "الحليب"]),
      listen("water", ["water", "milk", "bread", "juice"]),
    ]),
    unit("en", "greetings", { ar: "التحيات", en: "Greetings" }, { ar: "قل مرحباً ووداعاً", en: "Say hello and goodbye" }, [
      mc("hello", "مرحبا", [["مرحبا", "👋"], ["وداعا", "🙋"], ["شكرا", "🙏"], ["آسف", "😔"]]),
      mc("thank you", "شكرا", [["من فضلك", "🥺"], ["شكرا", "🙏"], ["مرحبا", "👋"], ["نعم", "👍"]]),
      builder("Good morning", "صباح الخير", ["مساء", "النور", "ليلة"]),
      listen("goodbye", ["goodbye", "good night", "hello", "sorry"]),
      typeEn("نعم", "yes"),
      match([["yes", "نعم"], ["no", "لا"], ["please", "من فضلك"], ["sorry", "آسف"]]),
      builder("How are you", "كيف حالك", ["أين", "من", "أنت"]),
      mc("good night", "تصبح على خير", [["تصبح على خير", "🌙"], ["صباح الخير", "☀️"], ["مساء الخير", "🌆"], ["أهلا", "🤗"]]),
    ]),
    unit("en", "food", { ar: "الطعام", en: "Food" }, { ar: "اطلب طعامك كالمحترفين", en: "Order like a local" }, [
      mc("the apple", "التفاحة", [["الخبز", "🍞"], ["التفاحة", "🍎"], ["الجبن", "🧀"], ["البيضة", "🥚"]]),
      builder("I eat bread", "أنا آكل الخبز", ["تشرب", "التفاحة", "أنت"]),
      mc("the coffee", "القهوة", [["الشاي", "🍵"], ["العصير", "🧃"], ["القهوة", "☕"], ["الحليب", "🥛"]]),
      listen("rice", ["rice", "milk", "meat", "fish"]),
      typeEn("حليب", "milk", "the milk"),
      match([["bread", "خبز"], ["milk", "حليب"], ["meat", "لحم"], ["fish", "سمك"]]),
      builder("She wants pizza", "هي تريد بيتزا", ["هو", "يأكل", "حساء"]),
      mc("the orange", "البرتقالة", [["البرتقالة", "🍊"], ["الموزة", "🍌"], ["العنب", "🍇"], ["الفراولة", "🍓"]]),
    ]),
    unit("en", "family", { ar: "العائلة", en: "Family" }, { ar: "تحدث عن أهلك", en: "Talk about your family" }, [
      mc("the mother", "الأم", [["الأم", "👩"], ["الأب", "👨"], ["الجدة", "👵"], ["الأخ", "👦"]]),
      mc("the father", "الأب", [["الأب", "👨"], ["الطفل", "👶"], ["الجد", "👴"], ["الأخت", "👧"]]),
      builder("This is my brother", "هذا أخي", ["هذه", "أختي", "أمي"]),
      listen("sister", ["sister", "brother", "mother", "father"]),
      typeEn("عائلة", "family", "a family", "the family"),
      match([["mother", "أم"], ["father", "أب"], ["brother", "أخ"], ["sister", "أخت"]]),
      builder("I love my family", "أنا أحب عائلتي", ["أنت", "بيتي", "تحب"]),
      mc("the baby", "الطفل", [["الطفل", "👶"], ["الجد", "👴"], ["الجدة", "👵"], ["الأب", "👨"]]),
    ]),
    unit("en", "travel", { ar: "السفر", en: "Travel" }, { ar: "تنقّل في المدينة", en: "Get around the city" }, [
      mc("the train", "القطار", [["الطائرة", "✈️"], ["القطار", "🚆"], ["السيارة", "🚗"], ["القارب", "⛵"]]),
      builder("Where is the hotel", "أين الفندق", ["من", "الشاطئ", "متى"]),
      mc("the beach", "الشاطئ", [["الشاطئ", "🏖️"], ["الجبل", "⛰️"], ["المدينة", "🏙️"], ["الغابة", "🌲"]]),
      listen("airport", ["airport", "hotel", "station", "market"]),
      typeEn("سيارة", "car", "a car", "the car"),
      match([["plane", "طائرة"], ["car", "سيارة"], ["hotel", "فندق"], ["ticket", "تذكرة"]]),
      builder("I need a taxi", "أحتاج سيارة أجرة", ["أريد", "حافلة", "الفندق"]),
      mc("the passport", "جواز السفر", [["جواز السفر", "🛂"], ["الحقيبة", "🧳"], ["الخريطة", "🗺️"], ["التذكرة", "🎫"]]),
    ]),
    unit("en", "numbers", { ar: "الأرقام والألوان", en: "Numbers & colors" }, { ar: "عدّ ولوّن", en: "Count and describe" }, [
      mc("red", "أحمر", [["أحمر", "🔴"], ["أزرق", "🔵"], ["أخضر", "🟢"], ["أصفر", "🟡"]]),
      mc("three", "ثلاثة", [["واحد", "1️⃣"], ["اثنان", "2️⃣"], ["ثلاثة", "3️⃣"], ["أربعة", "4️⃣"]]),
      listen("five", ["five", "four", "nine", "seven"]),
      typeEn("أزرق", "blue"),
      match([["one", "واحد"], ["two", "اثنان"], ["black", "أسود"], ["white", "أبيض"]]),
      builder("I have two cats", "لدي قطتان", ["كلبان", "ثلاث", "لديك"]),
      builder("The car is green", "السيارة خضراء", ["حمراء", "الحافلة", "زرقاء"]),
      mc("ten", "عشرة", [["عشرة", "🔟"], ["ستة", "6️⃣"], ["ثمانية", "8️⃣"], ["تسعة", "9️⃣"]]),
    ]),
    unit("en", "verbs", { ar: "الأفعال", en: "Verbs" }, { ar: "أفعال تستخدمها كل يوم", en: "Verbs you use every day" }, [
      mc("to read", "يقرأ", [["يقرأ", "📖"], ["يكتب", "✍️"], ["يجري", "🏃"], ["ينام", "😴"]]),
      mc("to sleep", "ينام", [["ينام", "😴"], ["يقرأ", "📖"], ["يشرب", "🥤"], ["يسبح", "🏊"]]),
      listen("run", ["run", "walk", "jump", "swim"]),
      builder("He reads the book", "هو يقرأ الكتاب", ["يكتب", "هي", "القلم"]),
      typeEn("يكتب", "write", "to write"),
      match([["read", "يقرأ"], ["write", "يكتب"], ["sleep", "ينام"], ["run", "يجري"]]),
      builder("We play football", "نحن نلعب كرة القدم", ["أنتم", "نأكل", "السلة"]),
      mc("to drink", "يشرب", [["يشرب", "🥤"], ["يأكل", "🍽️"], ["يطبخ", "🍳"], ["يسبح", "🏊"]]),
    ]),
    unit("en", "places", { ar: "الأماكن", en: "Places" }, { ar: "أين تذهب؟", en: "Where are you going?" }, [
      mc("the school", "المدرسة", [["المدرسة", "🏫"], ["المستشفى", "🏥"], ["المطعم", "🍽️"], ["المكتبة", "📚"]]),
      mc("the hospital", "المستشفى", [["المستشفى", "🏥"], ["المدرسة", "🏫"], ["البنك", "🏦"], ["الحديقة", "🌳"]]),
      listen("library", ["library", "bank", "park", "school"]),
      builder("I go to school", "أنا أذهب إلى المدرسة", ["من", "المستشفى", "تذهب"]),
      typeEn("حديقة", "park", "a park", "the park"),
      match([["school", "مدرسة"], ["bank", "بنك"], ["park", "حديقة"], ["restaurant", "مطعم"]]),
      builder("The shop is near the bank", "المتجر قريب من البنك", ["بعيد", "المدرسة", "في"]),
      mc("the house", "البيت", [["البيت", "🏠"], ["المسجد", "🕌"], ["الكنيسة", "⛪"], ["الجسر", "🌉"]]),
    ]),
    unit("en", "time", { ar: "الوقت والأيام", en: "Time & days" }, { ar: "تحدث عن يومك", en: "Talk about your day" }, [
      mc("today", "اليوم", [["اليوم", "📆"], ["غدا", "⏭️"], ["أمس", "⏮️"], ["الآن", "⏱️"]]),
      mc("morning", "الصباح", [["الصباح", "🌅"], ["الليل", "🌙"], ["الظهر", "☀️"], ["المساء", "🌇"]]),
      listen("tomorrow", ["tomorrow", "yesterday", "today", "night"]),
      builder("I wake up in the morning", "أنا أستيقظ في الصباح", ["أنام", "الليل", "أنت"]),
      typeEn("أسبوع", "week", "a week", "the week"),
      match([["today", "اليوم"], ["tomorrow", "غدا"], ["yesterday", "أمس"], ["now", "الآن"]]),
      builder("See you tomorrow", "أراك غدا", ["أمس", "نراك", "اليوم"]),
      mc("the year", "السنة", [["السنة", "🗓️"], ["الشهر", "📅"], ["الساعة", "🕐"], ["الدقيقة", "⏲️"]]),
    ]),
    unit("en", "questions", { ar: "الأسئلة", en: "Questions" }, { ar: "اسأل وتعرّف على الناس", en: "Ask and meet people" }, [
      mc("what", "ماذا", [["ماذا", "❓"], ["أين", "📍"], ["متى", "🕒"], ["لماذا", "🤔"]]),
      mc("where", "أين", [["أين", "📍"], ["من", "🧑"], ["كيف", "🛠️"], ["كم", "🔢"]]),
      listen("why", ["why", "who", "when", "what"]),
      builder("What is your name", "ما اسمك", ["أين", "كيف", "عمرك"]),
      typeEn("من", "who"),
      match([["who", "من"], ["what", "ماذا"], ["where", "أين"], ["when", "متى"]]),
      builder("Where do you live", "أين تسكن", ["متى", "أنا", "تعمل"]),
      builder("How old are you", "كم عمرك", ["أين", "اسمك", "أنت"]),
    ]),
    unit("en", "home", { ar: "في البيت", en: "At home" }, { ar: "أشياء حولك", en: "Things around you" }, [
      mc("the door", "الباب", [["الباب", "🚪"], ["السرير", "🛏️"], ["الكرسي", "🪑"], ["المفتاح", "🔑"]]),
      mc("the key", "المفتاح", [["المفتاح", "🔑"], ["النافذة", "🪟"], ["الباب", "🚪"], ["السرير", "🛏️"]]),
      listen("bed", ["bed", "door", "chair", "table"]),
      builder("The key is on the table", "المفتاح على الطاولة", ["تحت", "الباب", "السرير"]),
      typeEn("كرسي", "chair", "a chair", "the chair"),
      match([["door", "باب"], ["key", "مفتاح"], ["bed", "سرير"], ["window", "نافذة"]]),
      builder("I open the door", "أنا أفتح الباب", ["أغلق", "النافذة", "أنت"]),
      mc("the phone", "الهاتف", [["الهاتف", "📱"], ["الحاسوب", "💻"], ["الساعة", "⌚"], ["الكتاب", "📕"]]),
    ]),
  ],
};

// ---------- Learn Arabic (for English speakers) ----------
const typeAr = (show: string, ...accepted: string[]): TypeQuestion => ({ type: "type", show, showLang: "ar", answerLang: "en", accepted });

const ARABIC: Course = {
  id: "ar",
  target: "ar",
  native: "en",
  flag: "🇸🇦",
  title: { ar: "العربية", en: "Arabic" },
  subtitle: { ar: "للناطقين بالإنجليزية", en: "For English speakers" },
  units: [
    unit("ar", "basics", { ar: "الأساسيات", en: "Basics" }, { ar: "أول الكلمات العربية", en: "Your first Arabic words" }, [
      mc("ولد", "boy", [["boy", "👦"], ["girl", "👧"], ["man", "👨"], ["woman", "👩"]], "walad"),
      mc("قطة", "cat", [["dog", "🐶"], ["cat", "🐱"], ["bird", "🐦"], ["fish", "🐟"]], "qiṭṭa"),
      listen("بنت", ["بنت", "ولد", "رجل", "امرأة"]),
      builder("أنا ولد", "I am a boy", ["girl", "you", "the"]),
      typeAr("كلب", "dog", "a dog", "the dog"),
      match([["ولد", "boy"], ["بنت", "girl"], ["قطة", "cat"], ["كلب", "dog"]]),
      builder("المرأة تشرب الماء", "The woman drinks water", ["man", "eats", "milk"]),
      mc("ماء", "water", [["water", "💧"], ["milk", "🥛"], ["juice", "🧃"], ["tea", "🍵"]], "māʼ"),
    ]),
    unit("ar", "greetings", { ar: "التحيات", en: "Greetings" }, { ar: "قل مرحباً ووداعاً", en: "Say hello and goodbye" }, [
      mc("مرحبا", "hello", [["hello", "👋"], ["goodbye", "🙋"], ["thanks", "🙏"], ["sorry", "😔"]], "marḥaban"),
      mc("شكرا", "thank you", [["please", "🥺"], ["thank you", "🙏"], ["hello", "👋"], ["yes", "👍"]], "shukran"),
      listen("السلام عليكم", ["السلام عليكم", "صباح الخير", "مع السلامة", "شكرا"]),
      builder("صباح الخير", "Good morning", ["night", "evening", "bye"]),
      typeAr("نعم", "yes"),
      match([["نعم", "yes"], ["لا", "no"], ["شكرا", "thanks"], ["مرحبا", "hello"]]),
      builder("كيف حالك", "How are you", ["who", "is", "where"]),
      mc("مع السلامة", "goodbye", [["goodbye", "👋"], ["welcome", "🤗"], ["sorry", "😔"], ["please", "🥺"]], "maʿa as-salāma"),
    ]),
    unit("ar", "food", { ar: "الطعام", en: "Food" }, { ar: "اطلب طعامك", en: "Order food" }, [
      mc("تفاحة", "apple", [["bread", "🍞"], ["apple", "🍎"], ["cheese", "🧀"], ["egg", "🥚"]], "tuffāḥa"),
      mc("قهوة", "coffee", [["tea", "🍵"], ["juice", "🧃"], ["coffee", "☕"], ["milk", "🥛"]], "qahwa"),
      listen("خبز", ["خبز", "حليب", "لحم", "أرز"]),
      builder("أنا آكل الخبز", "I eat bread", ["drink", "apple", "you"]),
      typeAr("حليب", "milk", "the milk"),
      match([["خبز", "bread"], ["حليب", "milk"], ["لحم", "meat"], ["سمك", "fish"]]),
      builder("هي تريد شاي", "She wants tea", ["he", "eats", "coffee"]),
      mc("تمر", "dates", [["dates", "🌴"], ["grapes", "🍇"], ["banana", "🍌"], ["orange", "🍊"]], "tamr"),
    ]),
    unit("ar", "family", { ar: "العائلة", en: "Family" }, { ar: "تحدث عن أهلك", en: "Talk about your family" }, [
      mc("أم", "mother", [["mother", "👩"], ["father", "👨"], ["grandmother", "👵"], ["brother", "👦"]], "umm"),
      mc("أب", "father", [["father", "👨"], ["son", "👶"], ["grandfather", "👴"], ["sister", "👧"]], "ab"),
      listen("أخت", ["أخت", "أخ", "أم", "أب"]),
      builder("هذا أخي", "This is my brother", ["sister", "her", "mother"]),
      typeAr("عائلة", "family", "a family", "the family"),
      match([["أم", "mother"], ["أب", "father"], ["أخ", "brother"], ["أخت", "sister"]]),
      builder("أنا أحب عائلتي", "I love my family", ["you", "house", "loves"]),
      mc("جد", "grandfather", [["grandfather", "👴"], ["baby", "👶"], ["grandmother", "👵"], ["father", "👨"]], "jadd"),
    ]),
    unit("ar", "travel", { ar: "السفر", en: "Travel" }, { ar: "تنقّل في المدينة", en: "Get around the city" }, [
      mc("قطار", "train", [["plane", "✈️"], ["train", "🚆"], ["car", "🚗"], ["boat", "⛵"]], "qiṭār"),
      mc("شاطئ", "beach", [["beach", "🏖️"], ["mountain", "⛰️"], ["city", "🏙️"], ["forest", "🌲"]], "shāṭiʼ"),
      listen("فندق", ["فندق", "مطار", "سوق", "شارع"]),
      builder("أين الفندق", "Where is the hotel", ["who", "beach", "a"]),
      typeAr("سيارة", "car", "a car", "the car"),
      match([["طائرة", "plane"], ["سيارة", "car"], ["فندق", "hotel"], ["تذكرة", "ticket"]]),
      builder("أحتاج سيارة أجرة", "I need a taxi", ["want", "the", "bus"]),
      mc("سوق", "market", [["market", "🛍️"], ["hotel", "🏨"], ["airport", "🛫"], ["station", "🚉"]], "sūq"),
    ]),
    unit("ar", "verbs", { ar: "الأفعال", en: "Verbs" }, { ar: "أفعال تستخدمها كل يوم", en: "Verbs you use every day" }, [
      mc("يقرأ", "he reads", [["he reads", "📖"], ["he writes", "✍️"], ["he runs", "🏃"], ["he sleeps", "😴"]], "yaqraʼ"),
      mc("ينام", "he sleeps", [["he sleeps", "😴"], ["he reads", "📖"], ["he drinks", "🥤"], ["he swims", "🏊"]], "yanām"),
      listen("يكتب", ["يكتب", "يقرأ", "يجري", "ينام"]),
      builder("هو يقرأ الكتاب", "He reads the book", ["writes", "she", "pen"]),
      typeAr("يشرب", "drinks", "he drinks", "drink", "to drink"),
      match([["يقرأ", "reads"], ["يكتب", "writes"], ["ينام", "sleeps"], ["يجري", "runs"]]),
      builder("نحن نلعب كرة القدم", "We play football", ["you", "eat", "basket"]),
      mc("يأكل", "he eats", [["he eats", "🍽️"], ["he drinks", "🥤"], ["he cooks", "🍳"], ["he swims", "🏊"]], "yaʼkul"),
    ]),
    unit("ar", "places", { ar: "الأماكن", en: "Places" }, { ar: "أين تذهب؟", en: "Where are you going?" }, [
      mc("مدرسة", "school", [["school", "🏫"], ["hospital", "🏥"], ["restaurant", "🍽️"], ["library", "📚"]], "madrasa"),
      mc("مستشفى", "hospital", [["hospital", "🏥"], ["school", "🏫"], ["bank", "🏦"], ["park", "🌳"]], "mustashfā"),
      listen("مكتبة", ["مكتبة", "بنك", "حديقة", "مدرسة"]),
      builder("أنا أذهب إلى المدرسة", "I go to school", ["hospital", "you", "from"]),
      typeAr("حديقة", "park", "a park", "the park"),
      match([["مدرسة", "school"], ["بنك", "bank"], ["حديقة", "park"], ["مطعم", "restaurant"]]),
      builder("المتجر قريب من البنك", "The shop is near the bank", ["far", "school", "in"]),
      mc("بيت", "house", [["house", "🏠"], ["mosque", "🕌"], ["church", "⛪"], ["bridge", "🌉"]], "bayt"),
    ]),
    unit("ar", "time", { ar: "الوقت والأيام", en: "Time & days" }, { ar: "تحدث عن يومك", en: "Talk about your day" }, [
      mc("اليوم", "today", [["today", "📆"], ["tomorrow", "⏭️"], ["yesterday", "⏮️"], ["now", "⏱️"]], "al-yawm"),
      mc("صباح", "morning", [["morning", "🌅"], ["night", "🌙"], ["noon", "☀️"], ["evening", "🌇"]], "ṣabāḥ"),
      listen("غدا", ["غدا", "أمس", "اليوم", "ليل"]),
      builder("أنا أستيقظ في الصباح", "I wake up in the morning", ["sleep", "night", "you"]),
      typeAr("أسبوع", "week", "a week", "the week"),
      match([["اليوم", "today"], ["غدا", "tomorrow"], ["أمس", "yesterday"], ["الآن", "now"]]),
      builder("أراك غدا", "See you tomorrow", ["yesterday", "today", "night"]),
      mc("سنة", "year", [["year", "🗓️"], ["month", "📅"], ["hour", "🕐"], ["minute", "⏲️"]], "sana"),
    ]),
    unit("ar", "questions", { ar: "الأسئلة", en: "Questions" }, { ar: "اسأل وتعرّف على الناس", en: "Ask and meet people" }, [
      mc("ماذا", "what", [["what", "❓"], ["where", "📍"], ["when", "🕒"], ["why", "🤔"]], "mādhā"),
      mc("أين", "where", [["where", "📍"], ["who", "🧑"], ["how", "🛠️"], ["how many", "🔢"]], "ayna"),
      listen("لماذا", ["لماذا", "من", "متى", "ماذا"]),
      builder("ما اسمك", "What is your name", ["where", "how", "age"]),
      typeAr("من", "who"),
      match([["من", "who"], ["ماذا", "what"], ["أين", "where"], ["متى", "when"]]),
      builder("أين تسكن", "Where do you live", ["when", "I", "work"]),
      builder("كم عمرك", "How old are you", ["where", "name", "I"]),
    ]),
    unit("ar", "home", { ar: "في البيت", en: "At home" }, { ar: "أشياء حولك", en: "Things around you" }, [
      mc("باب", "door", [["door", "🚪"], ["bed", "🛏️"], ["chair", "🪑"], ["key", "🔑"]], "bāb"),
      mc("مفتاح", "key", [["key", "🔑"], ["window", "🪟"], ["door", "🚪"], ["bed", "🛏️"]], "miftāḥ"),
      listen("سرير", ["سرير", "باب", "كرسي", "طاولة"]),
      builder("المفتاح على الطاولة", "The key is on the table", ["under", "door", "bed"]),
      typeAr("كرسي", "chair", "a chair", "the chair"),
      match([["باب", "door"], ["مفتاح", "key"], ["سرير", "bed"], ["نافذة", "window"]]),
      builder("أنا أفتح الباب", "I open the door", ["close", "window", "you"]),
      mc("هاتف", "phone", [["phone", "📱"], ["computer", "💻"], ["watch", "⌚"], ["book", "📕"]], "hātif"),
    ]),
  ],
};

export const COURSES: Course[] = [ENGLISH, ARABIC, SPANISH, FRENCH, TURKISH, GERMAN];
export const getCourse = (id: CourseId | null | undefined) => COURSES.find((c) => c.id === id) ?? null;

export const lessonIdsOf = (course: Course) => course.units.flatMap((u) => u.lessons);
export const ALL_LESSON_IDS = COURSES.flatMap(lessonIdsOf);

export const QUESTIONS_PER_LESSON = 6;

export function findLesson(lessonId: string) {
  for (const course of COURSES) {
    const unit = course.units.find((u) => u.lessons.includes(lessonId));
    if (!unit) continue;
    const index = unit.lessons.indexOf(lessonId);
    // Rotate questions per lesson so each node feels distinct.
    const q = unit.questions;
    const n = Math.min(QUESTIONS_PER_LESSON, q.length);
    const idxs = Array.from({ length: n }, (_, i) => (i + index * 3) % q.length);
    const questions = idxs.map((i) => q[i]!);
    // Stable ids ("<unitId>:<position>") so progress can track individual questions.
    const keys = idxs.map((i) => `${unit.id}:${i}`);
    return { course, unit, index, questions, keys };
  }
  return null;
}

/** Resolve a question key produced by findLesson back to its question. */
export function findQuestion(key: string) {
  const at = key.lastIndexOf(":");
  if (at < 0) return null;
  const unitId = key.slice(0, at);
  const idx = Number(key.slice(at + 1));
  for (const course of COURSES) {
    const unit = course.units.find((u) => u.id === unitId);
    const question = unit?.questions[idx];
    if (unit && question) return { course, unit, question };
  }
  return null;
}

// ---------- Answer checking ----------
export function normalizeAnswer(s: string) {
  return s
    .toLocaleLowerCase()
    .replace(/ı/g, "i") // Turkish dotless i
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Latin accents (é → e, ñ → n, ü → u)
    .normalize("NFC")
    .replace(/[\u064B-\u0652\u0640]/g, "") // Arabic diacritics + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[.,!?¿¡؟،"'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function isTypedAnswerCorrect(q: TypeQuestion, input: string) {
  const v = normalizeAnswer(input);
  return v.length > 0 && q.accepted.some((a) => normalizeAnswer(a) === v);
}
export function isBuiltAnswerCorrect(q: BuilderQuestion, words: string[]) {
  return normalizeAnswer(words.join(" ")) === normalizeAnswer(q.answer.join(" "));
}

export const XP_PER_LESSON = 10;
export const XP_PERFECT_BONUS = 5;
export const XP_PER_PRACTICE = 5;
export const GEMS_PER_LESSON = 5;
export const MAX_HEARTS = 5;
export const REFILL_COST = 50;
export const MAX_REWARDED_ADS_PER_DAY = 5;
export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const;
