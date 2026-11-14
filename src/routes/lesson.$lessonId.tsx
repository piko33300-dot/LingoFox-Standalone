import { createFileRoute, notFound } from "@tanstack/react-router";
import { findLesson } from "@/lib/lessons";
import { Quiz } from "@/components/lingo/Quiz";

export const Route = createFileRoute("/lesson/$lessonId")({
  loader: ({ params }) => {
    const l = findLesson(params.lessonId);
    if (!l) throw notFound();
    return { unitTitle: l.unit.title.ar, courseTitle: l.course.title.ar, index: l.index };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.courseTitle} · ${loaderData.unitTitle} · الدرس ${loaderData.index + 1} — LingoFox` : "درس — LingoFox" },
      { name: "description", content: "درس تفاعلي: اختيار، استماع، كتابة، مطابقة وبناء جمل." },
      { property: "og:title", content: "درس LingoFox" },
      { property: "og:description", content: "تدرّب بأسئلة قصيرة وممتعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  return <Quiz key={lessonId} lessonId={lessonId} />;
}
