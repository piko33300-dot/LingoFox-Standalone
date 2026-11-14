import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/lingo/TopBar";
import { LessonPath } from "@/components/lingo/LessonPath";
import { AppPage, BottomNav } from "@/components/lingo/BottomNav";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "مسار التعلّم — LingoFox" },
      { name: "description", content: "تابع مسارك: الأساسيات، التحيات، الطعام، العائلة، السفر والمزيد." },
      { property: "og:title", content: "مسار التعلّم — LingoFox" },
      { property: "og:description", content: "تقدّم وحدة بعد وحدة وحقق هدفك اليومي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Learn,
});

function Learn() {
  return (
    <AppPage>
      <TopBar />
      <LessonPath />
      <BottomNav />
    </AppPage>
  );
}
