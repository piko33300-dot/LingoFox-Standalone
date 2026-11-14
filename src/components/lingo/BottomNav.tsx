import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Home, MessageCircle, Repeat, Trophy, User } from "lucide-react";
import { useT } from "@/lib/i18n";
import logoBadge from "@/assets/logo-badge.png";

const ITEMS = [
  { to: "/learn", icon: Home, key: "learn" },
  { to: "/tutor", icon: MessageCircle, key: "tutor" },
  { to: "/leaderboard", icon: Trophy, key: "leaderboard" },
  { to: "/profile", icon: User, key: "profile" },
] as const;

/** Extra destinations shown only in the wide-screen side rail. */
const WIDE_ITEMS = [
  { to: "/stories", icon: BookOpen, key: "storiesTitle" },
  { to: "/practice", icon: Repeat, key: "practiceTitle" },
] as const;

/** Bottom tab bar on phones; a side rail on wide screens. */
export function BottomNav() {
  const { t } = useT();
  return (
    <>
      <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border/70 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
          {ITEMS.map(({ to, icon: Icon, key }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 rounded-2xl py-1.5 font-display text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground shadow-soft" }}
            >
              <Icon className="size-6" />
              {t(key)}
            </Link>
          ))}
        </div>
      </nav>

      <nav className="bg-splash fixed inset-y-0 start-0 z-30 hidden w-64 flex-col px-4 py-6 text-secondary-foreground lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-3" dir="ltr">
          <img src={logoBadge} alt="" width={40} height={40} className="size-10" />
          <span className="font-display text-2xl font-bold">Lingo<span className="text-ember">Fox</span></span>
        </Link>
        <div className="flex flex-col gap-1.5">
          {[...ITEMS, ...WIDE_ITEMS].map(({ to, icon: Icon, key }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 font-display font-medium text-secondary-foreground/70 transition-colors hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary-foreground/15 text-secondary-foreground ring-1 ring-secondary-foreground/20" }}
            >
              <Icon className="size-6" />
              {t(key)}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export function AppPage({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background pb-24 lg:ps-64 lg:pb-10">{children}</div>;
}
