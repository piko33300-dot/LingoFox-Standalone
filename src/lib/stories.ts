// Short reading/listening stories per course. Shape mirrors a future `stories` table.
// Story ids are "<courseId>-story-<n>" so they group by course like lessons do.
import { COURSE_IDS, type CourseId, type Localized } from "./lessons";

export type StoryLine = { who: string; text: string; tr: string };
/** Shown right after line `after` (0-based); options are in the course's target language. */
export type StoryQuestion = { after: number; q: Localized; options: string[]; answer: number };
export type Story = {
  id: string;
  course: CourseId;
  emoji: string;
  title: Localized;
  lines: StoryLine[];
  questions: StoryQuestion[];
};

export const STORY_XP = 10;
export const STORY_GEMS = 5;
export const STORY_REPLAY_XP = 5;

const L = (who: string, text: string, tr: string): StoryLine => ({ who, text, tr });
const Q = (after: number, ar: string, en: string, options: string[], answer: number): StoryQuestion => ({ after, q: { ar, en }, options, answer });

export const STORIES: Story[] = [
  {
    id: "en-story-1", course: "en", emoji: "☕", title: { ar: "في المقهى", en: "At the café" },
    lines: [
      L("👩", "Good morning! One coffee, please.", "صباح الخير! قهوة واحدة من فضلك."),
      L("🧔", "Good morning! Milk or sugar?", "صباح الخير! حليب أم سكر؟"),
      L("👩", "Milk, please. No sugar.", "حليب من فضلك. بدون سكر."),
      L("🧔", "Here you are. That is three dollars.", "تفضلي. هذا بثلاثة دولارات."),
      L("👩", "Oh no! I don't have my wallet!", "يا إلهي! ليست معي محفظتي!"),
      L("🧔", "No problem. Pay tomorrow!", "لا مشكلة. ادفعي غداً!"),
    ],
    questions: [
      Q(2, "ماذا تريد مع القهوة؟", "What does she want in her coffee?", ["Milk", "Sugar", "Water"], 0),
      Q(5, "متى ستدفع؟", "When will she pay?", ["Today", "Tomorrow", "Never"], 1),
    ],
  },
  {
    id: "en-story-2", course: "en", emoji: "⚽", title: { ar: "صديق جديد", en: "A new friend" },
    lines: [
      L("👦", "Hello! My name is Omar. What is your name?", "مرحباً! اسمي عمر. ما اسمك؟"),
      L("👧", "Hi Omar! I am Lina. I am new here.", "أهلاً عمر! أنا لينا. أنا جديدة هنا."),
      L("👦", "Where are you from?", "من أين أنتِ؟"),
      L("👧", "I am from Egypt. And you?", "أنا من مصر. وأنت؟"),
      L("👦", "I am from Jordan. Do you like football?", "أنا من الأردن. هل تحبين كرة القدم؟"),
      L("👧", "Yes! Let's play after school.", "نعم! لنلعب بعد المدرسة."),
    ],
    questions: [
      Q(3, "من أين لينا؟", "Where is Lina from?", ["Jordan", "Egypt", "Spain"], 1),
      Q(5, "متى سيلعبان؟", "When will they play?", ["Before school", "After school", "At night"], 1),
    ],
  },
  {
    id: "ar-story-1", course: "ar", emoji: "🍎", title: { ar: "في السوق", en: "At the market" },
    lines: [
      L("👩", "مرحباً، أريد تفاحاً من فضلك.", "Hello, I want apples, please."),
      L("👨", "أهلاً وسهلاً! كم كيلو تريدين؟", "Welcome! How many kilos do you want?"),
      L("👩", "كيلو واحد فقط.", "Just one kilo."),
      L("👨", "تفضلي. هل تريدين خبزاً أيضاً؟", "Here you go. Do you want bread too?"),
      L("👩", "لا، شكراً. كم الثمن؟", "No, thanks. How much is it?"),
      L("👨", "خمسة دنانير.", "Five dinars."),
    ],
    questions: [
      Q(2, "كم كيلو تريد المرأة؟", "How many kilos does the woman want?", ["كيلو واحد", "كيلوان", "ثلاثة كيلو"], 0),
      Q(5, "كم الثمن؟", "How much is it?", ["خمسة دنانير", "عشرة دنانير", "دينار واحد"], 0),
    ],
  },
  {
    id: "ar-story-2", course: "ar", emoji: "☀️", title: { ar: "صباح يوم جديد", en: "A new morning" },
    lines: [
      L("👦", "صباح الخير يا أمي!", "Good morning, Mom!"),
      L("👩", "صباح النور يا علي! هل أنت جائع؟", "Good morning, Ali! Are you hungry?"),
      L("👦", "نعم، أريد بيضاً وحليباً.", "Yes, I want eggs and milk."),
      L("👩", "حسناً. أين حقيبتك؟", "Okay. Where is your bag?"),
      L("👦", "حقيبتي في غرفتي.", "My bag is in my room."),
      L("👩", "أسرع! الحافلة قادمة.", "Hurry! The bus is coming."),
    ],
    questions: [
      Q(2, "ماذا يريد علي أن يأكل؟", "What does Ali want to eat?", ["بيض وحليب", "خبز وجبن", "أرز ولحم"], 0),
      Q(4, "أين حقيبة علي؟", "Where is Ali's bag?", ["في المدرسة", "في غرفته", "في الحافلة"], 1),
    ],
  },
  {
    id: "es-story-1", course: "es", emoji: "☕", title: { ar: "في المقهى", en: "At the café" },
    lines: [
      L("👩", "¡Hola! Un café, por favor.", "مرحباً! قهوة واحدة من فضلك."),
      L("🧔", "¡Hola! ¿Con leche o sin leche?", "مرحباً! بالحليب أم بدون حليب؟"),
      L("👩", "Con leche, por favor.", "بالحليب من فضلك."),
      L("🧔", "Aquí tiene. Son dos euros.", "تفضلي. السعر يوروان."),
      L("👩", "¡Ay! No tengo dinero.", "آه! ليس معي مال."),
      L("🧔", "No pasa nada. ¡Mañana!", "لا بأس. غداً!"),
    ],
    questions: [
      Q(2, "كيف تريد القهوة؟", "How does she want her coffee?", ["Con leche", "Sin leche", "Con azúcar"], 0),
      Q(3, "كم سعر القهوة؟", "How much is the coffee?", ["Un euro", "Dos euros", "Tres euros"], 1),
    ],
  },
  {
    id: "es-story-2", course: "es", emoji: "🐶", title: { ar: "صديق جديد", en: "A new friend" },
    lines: [
      L("👦", "Hola, me llamo Pablo. ¿Y tú?", "مرحباً، اسمي بابلو. وأنتِ؟"),
      L("👧", "Me llamo Sara. Soy de Marruecos.", "اسمي سارة. أنا من المغرب."),
      L("👦", "¡Qué bien! Yo soy de Madrid.", "رائع! أنا من مدريد."),
      L("👧", "¿Tienes un perro?", "هل لديك كلب؟"),
      L("👦", "Sí, tengo un perro pequeño.", "نعم، لدي كلب صغير."),
      L("👧", "¡Me gustan los perros!", "أحب الكلاب!"),
    ],
    questions: [
      Q(1, "من أين سارة؟", "Where is Sara from?", ["De Madrid", "De Marruecos", "De Francia"], 1),
      Q(4, "كيف هو كلب بابلو؟", "What is Pablo's dog like?", ["Grande", "Pequeño", "Negro"], 1),
    ],
  },
  {
    id: "fr-story-1", course: "fr", emoji: "🥖", title: { ar: "في المخبز", en: "At the bakery" },
    lines: [
      L("👩", "Bonjour ! Une baguette, s'il vous plaît.", "صباح الخير! خبز باغيت واحد من فضلك."),
      L("👨", "Bonjour madame ! Et avec ça ?", "صباح الخير سيدتي! وماذا أيضاً؟"),
      L("👩", "Deux croissants, s'il vous plaît.", "كرواسونان من فضلك."),
      L("👨", "Voilà. Ça fait quatre euros.", "تفضلي. المجموع أربعة يوروهات."),
      L("👩", "Merci beaucoup ! Bonne journée !", "شكراً جزيلاً! يوماً سعيداً!"),
      L("👨", "Merci, à demain !", "شكراً، إلى الغد!"),
    ],
    questions: [
      Q(2, "كم كرواسون تريد؟", "How many croissants does she want?", ["Un", "Deux", "Trois"], 1),
      Q(3, "كم المجموع؟", "What is the total?", ["Deux euros", "Quatre euros", "Dix euros"], 1),
    ],
  },
  {
    id: "fr-story-2", course: "fr", emoji: "🌳", title: { ar: "في الحديقة", en: "At the park" },
    lines: [
      L("👧", "Salut ! Tu t'appelles comment ?", "مرحباً! ما اسمك؟"),
      L("👦", "Je m'appelle Karim. Et toi ?", "اسمي كريم. وأنتِ؟"),
      L("👧", "Moi, c'est Julie. J'aime le football.", "أنا جولي. أحب كرة القدم."),
      L("👦", "Moi aussi ! On joue ensemble ?", "وأنا أيضاً! هل نلعب معاً؟"),
      L("👧", "Oui ! Mais il pleut…", "نعم! لكنها تمطر…"),
      L("👦", "Pas de problème. Demain !", "لا مشكلة. غداً!"),
    ],
    questions: [
      Q(2, "ماذا تحب جولي؟", "What does Julie like?", ["Le football", "Le chocolat", "Les chats"], 0),
      Q(4, "كيف الطقس؟", "What is the weather like?", ["Il fait beau", "Il pleut", "Il neige"], 1),
    ],
  },
  {
    id: "tr-story-1", course: "tr", emoji: "🍵", title: { ar: "وقت الشاي", en: "Tea time" },
    lines: [
      L("👵", "Günaydın! Çay ister misin?", "صباح الخير! هل تريد شاياً؟"),
      L("👦", "Evet, lütfen. Şekersiz.", "نعم، من فضلك. بدون سكر."),
      L("👵", "Simit de ister misin?", "هل تريد سميطاً أيضاً؟"),
      L("👦", "Evet! Çok açım.", "نعم! أنا جائع جداً."),
      L("👵", "Buyurun. Afiyet olsun!", "تفضل. بالهناء والشفاء!"),
      L("👦", "Teşekkür ederim, anneanne!", "شكراً يا جدتي!"),
    ],
    questions: [
      Q(1, "كيف يريد الشاي؟", "How does he want the tea?", ["Şekerli", "Şekersiz", "Sütlü"], 1),
      Q(3, "لماذا يريد السميط؟", "Why does he want the simit?", ["Çok açım", "Çok yorgunum", "Çok mutluyum"], 0),
    ],
  },
  {
    id: "tr-story-2", course: "tr", emoji: "🚌", title: { ar: "في الحافلة", en: "On the bus" },
    lines: [
      L("👩", "Merhaba! Bu otobüs İstanbul'a gidiyor mu?", "مرحباً! هل تذهب هذه الحافلة إلى إسطنبول؟"),
      L("👨", "Evet, gidiyor.", "نعم، تذهب."),
      L("👩", "Bilet kaç lira?", "كم ليرة سعر التذكرة؟"),
      L("👨", "Elli lira.", "خمسون ليرة."),
      L("👩", "Tamam. Otobüs saat kaçta kalkıyor?", "حسناً. في أي ساعة تنطلق الحافلة؟"),
      L("👨", "Saat dokuzda.", "في الساعة التاسعة."),
    ],
    questions: [
      Q(3, "كم سعر التذكرة؟", "How much is the ticket?", ["On lira", "Elli lira", "Yüz lira"], 1),
      Q(5, "متى تنطلق الحافلة؟", "When does the bus leave?", ["Saat sekizde", "Saat dokuzda", "Saat onda"], 1),
    ],
  },
  {
    id: "de-story-1", course: "de", emoji: "🍰", title: { ar: "في المقهى", en: "At the café" },
    lines: [
      L("👩", "Hallo! Einen Kaffee, bitte.", "مرحباً! قهوة واحدة من فضلك."),
      L("👨", "Gern. Mit Milch?", "بكل سرور. بالحليب؟"),
      L("👩", "Nein, danke. Und ein Stück Kuchen.", "لا، شكراً. وقطعة كعك."),
      L("👨", "Das macht fünf Euro.", "المجموع خمسة يوروهات."),
      L("👩", "Hier, bitte.", "تفضل."),
      L("👨", "Danke! Schönen Tag noch!", "شكراً! يوماً سعيداً!"),
    ],
    questions: [
      Q(2, "ماذا تطلب مع القهوة؟", "What does she order with the coffee?", ["Milch", "Kuchen", "Wasser"], 1),
      Q(3, "كم المجموع؟", "What is the total?", ["Drei Euro", "Fünf Euro", "Zehn Euro"], 1),
    ],
  },
  {
    id: "de-story-2", course: "de", emoji: "🏠", title: { ar: "الشقة الجديدة", en: "The new flat" },
    lines: [
      L("👨", "Willkommen! Das ist meine neue Wohnung.", "أهلاً! هذه شقتي الجديدة."),
      L("👩", "Wow, sie ist sehr schön!", "واو، إنها جميلة جداً!"),
      L("👨", "Hier ist die Küche, und dort ist mein Zimmer.", "هنا المطبخ، وهناك غرفتي."),
      L("👩", "Hast du einen Balkon?", "هل لديك شرفة؟"),
      L("👨", "Ja! Komm, wir trinken Tee auf dem Balkon.", "نعم! تعالي، لنشرب الشاي على الشرفة."),
      L("👩", "Gute Idee!", "فكرة جيدة!"),
    ],
    questions: [
      Q(2, "ما الذي يوجد هنا؟", "What is here?", ["Die Küche", "Das Bad", "Der Garten"], 0),
      Q(4, "ماذا سيشربان؟", "What will they drink?", ["Kaffee", "Tee", "Saft"], 1),
    ],
  },
];

export const storiesOf = (course: CourseId) => STORIES.filter((s) => s.course === course);
export const findStory = (id: string) => STORIES.find((s) => s.id === id) ?? null;
export const isStoryId = (id: unknown): id is string => typeof id === "string" && STORIES.some((s) => s.id === id);
export const coursesWithStories = () => COURSE_IDS.filter((c) => storiesOf(c).length > 0);

export type StoryStep = { kind: "line"; index: number } | { kind: "question"; index: number };

/** Lines in order, with each question placed right after its line. */
export function storySteps(story: Story): StoryStep[] {
  const steps: StoryStep[] = [];
  story.lines.forEach((_, i) => {
    steps.push({ kind: "line", index: i });
    story.questions.forEach((q, qi) => { if (q.after === i) steps.push({ kind: "question", index: qi }); });
  });
  return steps;
}

/** First read earns full XP + gems; re-reading still counts for the streak with a smaller reward. */
export function storyReward(alreadyRead: boolean) {
  return alreadyRead ? { xp: STORY_REPLAY_XP, gems: 0 } : { xp: STORY_XP, gems: STORY_GEMS };
}
