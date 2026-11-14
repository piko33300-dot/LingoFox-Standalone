import { beginnerUnits, builder, listen, match, mc, typeTarget, unit, type Course } from "../course-kit";

// Learn Spanish (for Arabic speakers). Pairs in match() are [target, native].
export const SPANISH: Course = {
  id: "es",
  target: "es",
  native: "ar",
  flag: "🇪🇸",
  title: { ar: "الإسبانية", en: "Spanish" },
  subtitle: { ar: "للناطقين بالعربية", en: "For Arabic speakers" },
  units: [
    unit("es", "basics", { ar: "الأساسيات", en: "Basics" }, { ar: "أول كلماتك بالإسبانية", en: "Your first Spanish words" }, [
      mc("el niño", "الولد", [["الولد", "👦"], ["البنت", "👧"], ["الرجل", "👨"], ["المرأة", "👩"]]),
      listen("la niña", ["la niña", "el niño", "la mujer", "el hombre"]),
      builder("Yo soy un niño", "أنا ولد", ["بنت", "أنت", "هو"]),
      mc("el gato", "القطة", [["الكلب", "🐶"], ["القطة", "🐱"], ["الطائر", "🐦"], ["السمكة", "🐟"]]),
      typeTarget("es", "كلب", "perro", "el perro", "un perro"),
      match([["niño", "ولد"], ["niña", "بنت"], ["gato", "قطة"], ["perro", "كلب"]]),
      builder("La mujer bebe agua", "المرأة تشرب الماء", ["الرجل", "يأكل", "الحليب"]),
      listen("agua", ["agua", "leche", "pan", "jugo"]),
      typeTarget("es", "رجل", "hombre", "el hombre", "un hombre"),
    ]),
    ...beginnerUnits("es", [
      {
        words: [
          "hola", "adiós", "gracias", "por favor",
          "sí", "no", "lo siento", "buenas noches",
        ],
        sentences: ["Buenos días", "¿Cómo estás?"],
      },
      {
        words: [
          "la manzana", "el café", "el arroz", "el pan",
          "la leche", "la carne", "el pescado", "el queso",
        ],
        sentences: ["Yo como pan", "Ella quiere pizza"],
      },
      {
        words: [
          "la madre", "el padre", "la hermana", "el hermano",
          "la familia", "el bebé", "la abuela", "el abuelo",
        ],
        sentences: ["Este es mi hermano", "Yo quiero a mi familia"],
      },
      {
        words: [
          "el tren", "la playa", "el aeropuerto", "el hotel",
          "el coche", "el billete", "el avión", "el pasaporte",
        ],
        sentences: ["¿Dónde está el hotel?", "Necesito un taxi"],
      },
      {
        words: [
          "rojo", "tres", "cinco", "azul",
          "verde", "amarillo", "uno", "dos",
        ],
        sentences: ["Tengo tres libros", "El coche es rojo"],
      },
      {
        words: [
          "lee", "escribe", "duerme", "trabaja",
          "come", "bebe", "va", "viene",
        ],
        sentences: ["Yo leo un libro", "Él trabaja hoy"],
      },
      {
        words: [
          "la escuela", "el hospital", "el parque", "el restaurante",
          "el mercado", "el banco", "la farmacia", "la biblioteca",
        ],
        sentences: ["¿Dónde está el hospital?", "Estoy en el parque"],
      },
    ]),
  ],
};
