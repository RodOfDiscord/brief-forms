import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Shield } from "lucide-react";
import { verifyAdminToken } from "@/lib/auth/jwt";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const isAdmin = token ? !!(await verifyAdminToken(token)) : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FormsBrief</span>
          </div>
          {isAdmin ? (
            <LogoutButton />
          ) : (
            <Button variant="outline" asChild>
              <Link href="/auth/login">
                <Shield className="h-4 w-4 mr-2" />
                Адмін
              </Link>
            </Button>
          )}
        </div>

        {/* Hero */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Створюйте форми{" "}
            <span className="text-primary">легко та швидко</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            FormsBrief — це простий інструмент для створення онлайн-опитувань,
            квізів та форм для збору даних. Підтримка умовної логіки,
            різних типів питань та анонімних відповідей.
          </p>
          {isAdmin && (
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Перейти до дашборду
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Різні типи питань</h3>
            <p className="text-sm text-muted-foreground">
              Текст, одиночний вибір, множинний вибір
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
              </svg>
            </div>
            <h3 className="font-semibold">Умовна логіка</h3>
            <p className="text-sm text-muted-foreground">
              Показуйте питання залежно від попередніх відповідей
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Захищена адмін-панель</h3>
            <p className="text-sm text-muted-foreground">
              JWT-автентифікація для адміністраторів
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
