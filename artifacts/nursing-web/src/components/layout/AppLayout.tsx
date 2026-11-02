import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, BarChart3, ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: BookOpen },
    { href: "/progress", label: "Progress", icon: BarChart3 },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary cursor-pointer">
          <BookOpen className="h-6 w-6" />
          <span>Nursing Review</span>
        </Link>
      </div>
      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Nav & Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="md:hidden flex h-16 items-center justify-between border-b bg-white px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <BookOpen className="h-6 w-6" />
            <span>Nursing Review</span>
          </Link>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-5xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
