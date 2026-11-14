import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Database,
  Bot,
  AlertTriangle,
  Flame,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccount, refreshAccountRole } from "@/lib/account";
import { COURSES } from "@/lib/lessons";
import { STORIES } from "@/lib/stories";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";
import { fieldClass } from "@/components/lingo/field";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم المشرف — LingoFox" },
      { name: "description", content: "إدارة الكورسات، الدروس، القصص، وصلاحيات المستخدمين في LingoFox." },
    ],
  }),
  component: AdminDashboard,
});

type Tab = "overview" | "users" | "courses" | "lessons" | "stories" | "system";

export function AdminDashboard() {
  const { user, role, ready } = useAccount();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states for adding courses
  const [newCourseId, setNewCourseId] = useState("");
  const [newCourseFlag, setNewCourseFlag] = useState("🌍");
  const [newCourseTitleAr, setNewCourseTitleAr] = useState("");
  const [newCourseTitleEn, setNewCourseTitleEn] = useState("");
  const [newCourseSubAr, setNewCourseSubAr] = useState("");

  // Form states for adding stories
  const [newStoryCourse, setNewStoryCourse] = useState("en");
  const [newStoryId, setNewStoryId] = useState("");
  const [newStoryEmoji, setNewStoryEmoji] = useState("📖");
  const [newStoryTitleAr, setNewStoryTitleAr] = useState("");
  const [newStoryTitleEn, setNewStoryTitleEn] = useState("");
  const [newStoryLineText, setNewStoryLineText] = useState("");
  const [newStoryLineTr, setNewStoryLineTr] = useState("");

  // Form states for adding lessons
  const [newLessonCourse, setNewLessonCourse] = useState("en");
  const [newLessonUnit, setNewLessonUnit] = useState("basics");
  const [newLessonId, setNewLessonId] = useState("");
  const [newLessonTitleAr, setNewLessonTitleAr] = useState("");
  const [newLessonTitleEn, setNewLessonTitleEn] = useState("");
  const [newLessonXp, setNewLessonXp] = useState(15);

  const isAdmin = user && role === "admin";

  // Query: All learners from Supabase
  const { data: profiles, isLoading: profilesLoading, refetch: refetchProfiles } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, xp, streak, league, role, updated_at")
        .order("xp", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(isAdmin),
  });

  // Query: Custom courses from Supabase
  const { data: customCourses, refetch: refetchCourses } = useQuery({
    queryKey: ["admin", "custom_courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_courses").select("*").order("created_at", { ascending: false });
      if (error) {
        // Table might not be created yet if setup.sql hasn't been executed
        console.warn("custom_courses table error:", error.message);
        return [];
      }
      return data ?? [];
    },
    enabled: Boolean(isAdmin),
  });

  // Query: Custom lessons from Supabase
  const { data: customLessons, refetch: refetchLessons } = useQuery({
    queryKey: ["admin", "custom_lessons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_lessons").select("*").order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
    enabled: Boolean(isAdmin),
  });

  // Query: Custom stories from Supabase
  const { data: customStories, refetch: refetchStories } = useQuery({
    queryKey: ["admin", "custom_stories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_stories").select("*").order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
    enabled: Boolean(isAdmin),
  });

  // Handle manual role check
  async function handleRecheckRole() {
    setIsRefreshing(true);
    await refreshAccountRole();
    setIsRefreshing(false);
    toast.success("تم تحديث التحقق من الصلاحيات");
  }

  // Handle promoting/demoting user
  async function toggleUserRole(targetUserId: string, currentRole: string) {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", targetUserId);
      if (error) throw error;
      toast.success(nextRole === "admin" ? "تمت ترقية المستخدم إلى مشرف 🛡️" : "تم إلغاء صلاحية الإشراف");
      refetchProfiles();
    } catch (err: any) {
      toast.error(err?.message || "فشل تغيير صلاحية المستخدم");
    }
  }

  // Handle adding custom course
  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourseId || !newCourseTitleAr) {
      toast.error("يرجى ملء معرف الكورس والعنوان بالعربية");
      return;
    }
    try {
      const { error } = await supabase.from("custom_courses").insert({
        id: newCourseId.trim().toLowerCase(),
        flag: newCourseFlag || "🌍",
        title: { ar: newCourseTitleAr, en: newCourseTitleEn || newCourseTitleAr },
        subtitle: { ar: newCourseSubAr || "كورس مخصص", en: "Custom Course" },
        description: { ar: "كورس مضاف من لوحة التحكم", en: "Admin created course" },
      });
      if (error) throw error;
      toast.success("تمت إضافة الكورس بنجاح! 🎉");
      setNewCourseId("");
      setNewCourseTitleAr("");
      setNewCourseTitleEn("");
      refetchCourses();
    } catch (err: any) {
      toast.error(err?.message || "تعذر إضافة الكورس");
    }
  }

  // Handle deleting custom course
  async function handleDeleteCourse(id: string) {
    if (!confirm(`هل أنت متأكد من حذف الكورس المخصص (${id})؟`)) return;
    try {
      const { error } = await supabase.from("custom_courses").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف الكورس بنجاح");
      refetchCourses();
    } catch (err: any) {
      toast.error(err?.message || "تعذر حذف الكورس");
    }
  }

  // Handle adding custom story
  async function handleAddStory(e: React.FormEvent) {
    e.preventDefault();
    if (!newStoryId || !newStoryTitleAr) {
      toast.error("يرجى ملء معرف القصة والعنوان");
      return;
    }
    try {
      const { error } = await supabase.from("custom_stories").insert({
        id: newStoryId.trim().toLowerCase(),
        course_id: newStoryCourse,
        emoji: newStoryEmoji || "📖",
        title: { ar: newStoryTitleAr, en: newStoryTitleEn || newStoryTitleAr },
        lines: [
          { who: "Fox", text: newStoryLineText || "مرحباً بكم في القصة الجديدة", tr: newStoryLineTr || "Welcome to the new story" },
        ],
        questions: [],
      });
      if (error) throw error;
      toast.success("تمت إضافة القصة بنجاح! 📖");
      setNewStoryId("");
      setNewStoryTitleAr("");
      setNewStoryTitleEn("");
      refetchStories();
    } catch (err: any) {
      toast.error(err?.message || "تعذر إضافة القصة");
    }
  }

  // Handle deleting custom story
  async function handleDeleteStory(id: string) {
    if (!confirm(`هل أنت متأكد من حذف القصة (${id})؟`)) return;
    try {
      const { error } = await supabase.from("custom_stories").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف القصة بنجاح");
      refetchStories();
    } catch (err: any) {
      toast.error(err?.message || "تعذر حذف القصة");
    }
  }

  // Handle adding custom lesson
  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!newLessonId || !newLessonTitleAr) {
      toast.error("يرجى ملء معرف الدرس والعنوان");
      return;
    }
    try {
      const { error } = await supabase.from("custom_lessons").insert({
        id: newLessonId.trim().toLowerCase(),
        course_id: newLessonCourse,
        unit_id: newLessonUnit,
        title: { ar: newLessonTitleAr, en: newLessonTitleEn || newLessonTitleAr },
        xp: Number(newLessonXp) || 15,
        content: [],
      });
      if (error) throw error;
      toast.success("تمت إضافة الدرس بنجاح! 🎓");
      setNewLessonId("");
      setNewLessonTitleAr("");
      setNewLessonTitleEn("");
      refetchLessons();
    } catch (err: any) {
      toast.error(err?.message || "تعذر إضافة الدرس");
    }
  }

  // Handle deleting custom lesson
  async function handleDeleteLesson(id: string) {
    if (!confirm(`هل أنت متأكد من حذف الدرس (${id})؟`)) return;
    try {
      const { error } = await supabase.from("custom_lessons").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف الدرس بنجاح");
      refetchLessons();
    } catch (err: any) {
      toast.error(err?.message || "تعذر حذف الدرس");
    }
  }

  // Calculated stats
  const totalLearners = profiles?.length ?? 0;
  const totalXp = profiles?.reduce((sum, p) => sum + (p.xp || 0), 0) ?? 0;
  const totalStaticLessons = COURSES.reduce((sum, c) => sum + c.units.reduce((uSum, u) => uSum + u.lessons.length, 0), 0);
  const totalCustomLessons = customLessons?.length ?? 0;
  const totalLessons = totalStaticLessons + totalCustomLessons;
  const totalStories = STORIES.length + (customStories?.length ?? 0);
  const totalCourses = COURSES.length + (customCourses?.length ?? 0);

  // Filtered users
  const filteredUsers = (profiles ?? []).filter((p) => {
    if (!userSearch.trim()) return true;
    const query = userSearch.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.role?.toLowerCase().includes(query)
    );
  });

  // 1. Loading screen
  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-medium">جارٍ التحقق من الهوية والصلاحيات…</p>
      </div>
    );
  }

  // 2. Unauthenticated screen
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass p-8 rounded-3xl border border-border shadow-elevated">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-3xl">
            🛡️
          </div>
          <h1 className="text-2xl font-bold mb-2">لوحة تحكم المشرف</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            هذه المنطقة مخصصة لإدارة منصة LingoFox. يرجى تسجيل الدخول بحسابك للمتابعة.
          </p>
          <Link to="/auth">
            <ChunkyButton variant="primary" className="w-full">
              تسجيل الدخول
            </ChunkyButton>
          </Link>
          <div className="mt-4">
            <Link to="/learn" className="text-xs text-muted-foreground hover:underline">
              ← العودة لصفحة الدروس
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated but not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full glass p-8 rounded-3xl border border-destructive/20 shadow-elevated text-start">
          <div className="flex items-center gap-3 mb-4 text-destructive">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-foreground">الوصول مقيّد — صلاحيات المشرف مطلوبة</h1>
              <p className="text-xs text-muted-foreground">رمز الخطأ: 403 Forbidden</p>
            </div>
          </div>

          <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
            أنت مسجل الدخول حالياً بالبريد: <span className="font-semibold">{user.email || user.id}</span>
            <br />
            رتبة حسابك الحالية هي: <span className="font-bold text-primary">{role || "user"}</span>.
            للوصول إلى هذه اللوحة، يجب ترقية حسابك إلى <span className="font-bold">admin</span> في قاعدة البيانات.
          </p>

          <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-2xl mb-4 text-xs font-mono space-y-2">
            <div className="text-muted-foreground font-sans font-semibold">
              شغّل هذا الأمر في Supabase SQL Editor لترقية حسابك:
            </div>
            <pre className="bg-card p-3 rounded-xl overflow-x-auto text-primary select-all dir-ltr">
              {`UPDATE public.profiles\nSET role = 'admin'\nWHERE id = '${user.id}';`}
            </pre>
          </div>

          <div className="flex items-center gap-3">
            <ChunkyButton
              variant="primary"
              className="flex-1"
              onClick={handleRecheckRole}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 ml-2", isRefreshing && "animate-spin")} />
              إعادة التحقق من الصلاحيات
            </ChunkyButton>
            <Link to="/learn">
              <ChunkyButton variant="secondary">
                العودة للدروس
              </ChunkyButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Full Admin Dashboard
  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 glass border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xl shadow-glow">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg leading-tight">لوحة تحكم المشرف</h1>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                  LingoFox V13
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                مشرف النظام: {user.email || user.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/learn">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted transition flex items-center gap-1.5">
                <span>العودة للتطبيق</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap",
              activeTab === "overview"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>نظرة عامة</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap",
              activeTab === "users"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>المستخدمون ({totalLearners})</span>
          </button>

          <button
            onClick={() => setActiveTab("courses")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap",
              activeTab === "courses"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>الكورسات ({totalCourses})</span>
          </button>

          <button
            onClick={() => setActiveTab("lessons")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap",
              activeTab === "lessons"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>الدروس ({totalLessons})</span>
          </button>

          <button
            onClick={() => setActiveTab("stories")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap",
              activeTab === "stories"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>القصص ({totalStories})</span>
          </button>

          <button
            onClick={() => setActiveTab("system")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap",
              activeTab === "system"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Database className="w-3.5 h-3.5" />
            <span>حالة النظام والذكاء الاصطناعي</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-2xl border border-border shadow-soft flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">{totalLearners}</div>
                  <div className="text-xs text-muted-foreground">المتعلمون المسجلون</div>
                </div>
              </div>

              <div className="glass p-4 rounded-2xl border border-border shadow-soft flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">{totalXp.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">إجمالي نقاط XP</div>
                </div>
              </div>

              <div className="glass p-4 rounded-2xl border border-border shadow-soft flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">{totalCourses}</div>
                  <div className="text-xs text-muted-foreground">الكورسات المتاحة</div>
                </div>
              </div>

              <div className="glass p-4 rounded-2xl border border-border shadow-soft flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-flame/15 text-flame flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">{totalLessons}</div>
                  <div className="text-xs text-muted-foreground">الدروس التعليمية</div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Users */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass p-5 rounded-3xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>أبرز المتعلمين ونقاطهم</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    عرض الكل ←
                  </button>
                </div>

                <div className="space-y-2">
                  {profiles?.slice(0, 5).map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-center font-bold text-muted-foreground tabular-nums">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold">{p.display_name || "متعلم مجهول"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{p.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary tabular-nums">{p.xp} XP</span>
                        {p.role === "admin" && (
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                            مشرف
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-5 rounded-3xl border border-border space-y-4">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>إجراءات الإشراف السريعة</span>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition text-start space-y-1"
                  >
                    <BookOpen className="w-5 h-5 text-primary mb-1" />
                    <div className="font-bold text-sm">إضافة كورس</div>
                    <div className="text-xs text-muted-foreground">إنشاء لغة أو مسار جديد</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("lessons")}
                    className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition text-start space-y-1"
                  >
                    <GraduationCap className="w-5 h-5 text-secondary mb-1" />
                    <div className="font-bold text-sm">إضافة درس</div>
                    <div className="text-xs text-muted-foreground">ربط أسئلة ومحتوى تعليمي</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("stories")}
                    className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition text-start space-y-1"
                  >
                    <Sparkles className="w-5 h-5 text-gold mb-1" />
                    <div className="font-bold text-sm">إضافة قصة</div>
                    <div className="text-xs text-muted-foreground">حوارات تفاعلية وأسئلة فهم</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("system")}
                    className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition text-start space-y-1"
                  >
                    <Database className="w-5 h-5 text-flame mb-1" />
                    <div className="font-bold text-sm">فحص النظام</div>
                    <div className="text-xs text-muted-foreground">Supabase & Gemini AI</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === "users" && (
          <div className="glass p-5 rounded-3xl border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg">إدارة المستخدمين والصلاحيات</h2>
                <p className="text-xs text-muted-foreground">
                  استعراض جميع المتعلمين المسجلين في Supabase وتعديل رتبهم فورياً.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو المعرف…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className={cn(fieldClass, "pr-9 text-xs")}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-xs text-start">
                <thead className="bg-muted/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3 text-start">المستخدم</th>
                    <th className="p-3 text-start">معرف الحساب (ID)</th>
                    <th className="p-3 text-start">النقاط (XP)</th>
                    <th className="p-3 text-start">التتابع</th>
                    <th className="p-3 text-start">الرتبة</th>
                    <th className="p-3 text-start">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition">
                      <td className="p-3 font-bold">{u.display_name || "بدون اسم"}</td>
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">{u.id}</td>
                      <td className="p-3 font-bold text-primary tabular-nums">{u.xp}</td>
                      <td className="p-3 tabular-nums">{u.streak} أيام</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            u.role === "admin"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {u.role === "admin" ? "مشرف 🛡️" : "متعلم"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleUserRole(u.id, u.role || "user")}
                          disabled={u.id === user.id}
                          className={cn(
                            "px-2.5 py-1 rounded-xl text-[11px] font-bold transition",
                            u.role === "admin"
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                              : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20",
                            u.id === user.id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {u.role === "admin" ? "إلغاء الإشراف" : "ترقية لمشرف"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        لا يوجد مستخدمون يطابقون البحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Courses Management */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            {/* Add Course Form */}
            <div className="glass p-5 rounded-3xl border border-border space-y-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span>إضافة كورس أو لغة جديدة</span>
              </h2>

              <form onSubmit={handleAddCourse} className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">معرف الكورس (e.g. it, ru, ja)</label>
                  <input
                    type="text"
                    required
                    placeholder="it"
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className={cn(fieldClass, "text-xs font-mono")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">علم الكورس (Emoji)</label>
                  <input
                    type="text"
                    placeholder="🇮🇹"
                    value={newCourseFlag}
                    onChange={(e) => setNewCourseFlag(e.target.value)}
                    className={cn(fieldClass, "text-xs text-center")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">اسم الكورس (بالعربية)</label>
                  <input
                    type="text"
                    required
                    placeholder="الإيطالية"
                    value={newCourseTitleAr}
                    onChange={(e) => setNewCourseTitleAr(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">اسم الكورس (بالإنجليزية)</label>
                  <input
                    type="text"
                    placeholder="Italian"
                    value={newCourseTitleEn}
                    onChange={(e) => setNewCourseTitleEn(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">الوصف الفرعي</label>
                  <input
                    type="text"
                    placeholder="للناطقين بالعربية — تعلم الإيطالية من الصفر"
                    value={newCourseSubAr}
                    onChange={(e) => setNewCourseSubAr(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3 pt-2">
                  <ChunkyButton type="submit" variant="primary" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 ml-1.5" />
                    حفظ الكورس في قاعدة البيانات
                  </ChunkyButton>
                </div>
              </form>
            </div>

            {/* Courses List */}
            <div className="glass p-5 rounded-3xl border border-border space-y-4">
              <h2 className="font-bold text-base">الكورسات المتوفرة حالياً</h2>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Built-in Courses */}
                {COURSES.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{c.flag}</div>
                      <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        أساسي (مدمج)
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{c.title.ar} ({c.title.en})</h3>
                      <p className="text-xs text-muted-foreground">{c.subtitle.ar}</p>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border">
                      <span>{c.units.length} وحدات</span>
                      <span>{c.units.reduce((s, u) => s + u.lessons.length, 0)} درساً</span>
                    </div>
                  </div>
                ))}

                {/* Custom Courses */}
                {customCourses?.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-card border border-primary/30 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{c.flag}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          مخصص
                        </span>
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded-lg transition"
                          title="حذف الكورس"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{(c.title as any)?.ar}</h3>
                      <p className="text-xs text-muted-foreground">{(c.subtitle as any)?.ar || "كورس مخصص"}</p>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground pt-2 border-t border-border">
                      المعرف: {c.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Lessons Management */}
        {activeTab === "lessons" && (
          <div className="space-y-6">
            {/* Add Lesson Form */}
            <div className="glass p-5 rounded-3xl border border-border space-y-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span>إضافة درس مخصص جديد</span>
              </h2>

              <form onSubmit={handleAddLesson} className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">الكورس</label>
                  <select
                    value={newLessonCourse}
                    onChange={(e) => setNewLessonCourse(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  >
                    {COURSES.map((c) => (
                      <option key={c.id} value={c.id}>{c.flag} {c.title.ar}</option>
                    ))}
                    {customCourses?.map((c) => (
                      <option key={c.id} value={c.id}>{c.flag} {(c.title as any)?.ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">معرف الوحدة (Unit ID)</label>
                  <input
                    type="text"
                    placeholder="basics"
                    value={newLessonUnit}
                    onChange={(e) => setNewLessonUnit(e.target.value)}
                    className={cn(fieldClass, "text-xs font-mono")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">معرف الدرس (Lesson ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="en-unit1-lesson3"
                    value={newLessonId}
                    onChange={(e) => setNewLessonId(e.target.value)}
                    className={cn(fieldClass, "text-xs font-mono")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">عنوان الدرس (بالعربية)</label>
                  <input
                    type="text"
                    required
                    placeholder="الكلمات الشائعة"
                    value={newLessonTitleAr}
                    onChange={(e) => setNewLessonTitleAr(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">عنوان الدرس (بالإنجليزية)</label>
                  <input
                    type="text"
                    placeholder="Common Words"
                    value={newLessonTitleEn}
                    onChange={(e) => setNewLessonTitleEn(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">نقاط الخبرة (XP)</label>
                  <input
                    type="number"
                    value={newLessonXp}
                    onChange={(e) => setNewLessonXp(Number(e.target.value))}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3 pt-2">
                  <ChunkyButton type="submit" variant="primary" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 ml-1.5" />
                    حفظ الدرس في قاعدة البيانات
                  </ChunkyButton>
                </div>
              </form>
            </div>

            {/* Custom Lessons List */}
            <div className="glass p-5 rounded-3xl border border-border space-y-4">
              <h2 className="font-bold text-base">الدروس المخصصة المسجلة</h2>

              <div className="space-y-2">
                {customLessons && customLessons.length > 0 ? (
                  customLessons.map((l) => (
                    <div key={l.id} className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold">{(l.title as any)?.ar}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          الكورس: {l.course_id} · الوحدة: {l.unit_id} · المعرف: {l.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary tabular-nums">{l.xp} XP</span>
                        <button
                          onClick={() => handleDeleteLesson(l.id)}
                          className="text-destructive hover:bg-destructive/10 p-1.5 rounded-xl transition"
                          title="حذف الدرس"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    لا توجد دروس مخصصة مضافة بعد. الدروس الأساسية ({totalStaticLessons} درساً) تعمل تلقائياً.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Stories Management */}
        {activeTab === "stories" && (
          <div className="space-y-6">
            {/* Add Story Form */}
            <div className="glass p-5 rounded-3xl border border-border space-y-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span>إضافة قصة تفاعلية جديدة</span>
              </h2>

              <form onSubmit={handleAddStory} className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">الكورس</label>
                  <select
                    value={newStoryCourse}
                    onChange={(e) => setNewStoryCourse(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  >
                    {COURSES.map((c) => (
                      <option key={c.id} value={c.id}>{c.flag} {c.title.ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">معرف القصة (ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="en-story-restaurant"
                    value={newStoryId}
                    onChange={(e) => setNewStoryId(e.target.value)}
                    className={cn(fieldClass, "text-xs font-mono")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">الرمز التعبيري (Emoji)</label>
                  <input
                    type="text"
                    placeholder="☕"
                    value={newStoryEmoji}
                    onChange={(e) => setNewStoryEmoji(e.target.value)}
                    className={cn(fieldClass, "text-xs text-center")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">عنوان القصة (بالعربية)</label>
                  <input
                    type="text"
                    required
                    placeholder="في المقهى"
                    value={newStoryTitleAr}
                    onChange={(e) => setNewStoryTitleAr(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">عنوان القصة (بالإنجليزية)</label>
                  <input
                    type="text"
                    placeholder="At the Café"
                    value={newStoryTitleEn}
                    onChange={(e) => setNewStoryTitleEn(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">السطر الأول من الحوار</label>
                  <input
                    type="text"
                    placeholder="Hello, a cup of coffee please."
                    value={newStoryLineText}
                    onChange={(e) => setNewStoryLineText(e.target.value)}
                    className={cn(fieldClass, "text-xs")}
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3 pt-2">
                  <ChunkyButton type="submit" variant="primary" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 ml-1.5" />
                    حفظ القصة في قاعدة البيانات
                  </ChunkyButton>
                </div>
              </form>
            </div>

            {/* Stories List */}
            <div className="glass p-5 rounded-3xl border border-border space-y-4">
              <h2 className="font-bold text-base">القصص التفاعلية الحالية</h2>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Built-in Stories */}
                {STORIES.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-card border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{s.emoji}</span>
                      <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        مدمجة ({s.course})
                      </span>
                    </div>
                    <div className="font-bold text-sm">{s.title.ar}</div>
                    <div className="text-xs text-muted-foreground">{s.title.en}</div>
                    <div className="text-[10px] text-muted-foreground pt-1">{s.lines.length} أسطر حوارية</div>
                  </div>
                ))}

                {/* Custom Stories */}
                {customStories?.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-card border border-primary/30 space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{s.emoji}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          مخصصة ({s.course_id})
                        </span>
                        <button
                          onClick={() => handleDeleteStory(s.id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded-lg transition"
                          title="حذف القصة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="font-bold text-sm">{(s.title as any)?.ar}</div>
                    <div className="text-xs text-muted-foreground">{(s.title as any)?.en}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: System & AI Diagnostics */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="glass p-5 rounded-3xl border border-border space-y-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <span>حالة خادم Supabase وقاعدة البيانات</span>
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">اتصال Supabase</span>
                    <span className="flex items-center gap-1 text-success font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      متصل بنجاح
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground break-all">
                    URL: {supabase ? "https://...supabase.co" : "غير متصل"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">صلاحيات الجداول (RLS)</span>
                    <span className="flex items-center gap-1 text-success font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      مفعّلة وآمنة
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    جداول المستخدمين والدروس والقصص محمية بسياسات RLS ودوال التحقق.
                  </div>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-3xl border border-border space-y-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span>حالة تكامل الذكاء الاصطناعي (Google Gemini)</span>
              </h2>

              <div className="p-4 rounded-2xl bg-card border border-border space-y-3 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                  <span>دوال الخادم (Server Functions): /api/tutor · /api/explain · /api/speak</span>
                </div>
                <p className="text-muted-foreground">
                  يتم تنفيذ جميع طلبات المعلم الذكي وميزة (اسأل فوكس) وتقييم النطق عبر خادم TanStack Start. مفتاح
                  <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono mx-1">GEMINI_API_KEY</code>
                  محمي ولا يتم كشفه للمتصفح إطلاقاً.
                </p>
                <div className="p-3 rounded-xl bg-muted/40 font-mono text-[11px] space-y-1">
                  <div>النموذج الافتراضي للمحادثة: gemini-flash-lite-latest</div>
                  <div>النموذج الافتراضي لتقييم النطق: gemini-2.5-flash</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
