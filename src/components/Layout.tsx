import { NavLink, Outlet } from "react-router-dom";
import { Home, History, Settings, Bot, Menu } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
const navItems = [
  { href: "/", label: "New Meeting", icon: Home },
  { href: "/meetings", label: "Past Meetings", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];
const NavContent = () => (
  <ul className="grid items-start gap-1 font-medium">
    {navItems.map((item) => (
      <li key={item.label}>
        <NavLink
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-200/60",
              isActive && "bg-blue-100 text-blue-700 hover:text-blue-700"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      </li>
    ))}
  </ul>
);
export function Layout() {
  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r bg-slate-100/60 lg:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6">
              <a href="/" className="flex items-center gap-2 font-semibold">
                <Bot className="h-6 w-6 text-blue-600" />
                <span className="">MeetingScribe AI</span>
              </a>
            </div>
            <nav className="flex-1 px-4 py-4">
              <NavContent />
            </nav>
          </div>
        </aside>
        <div className="flex flex-col">
          <header className="flex h-16 items-center gap-4 border-b bg-slate-100/60 px-6 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                  <a href="/" className="flex items-center gap-2 font-semibold mb-4">
                    <Bot className="h-6 w-6 text-blue-600" />
                    <span className="">MeetingScribe AI</span>
                  </a>
                  <NavContent />
                </nav>
              </SheetContent>
            </Sheet>
            <a href="/" className="flex items-center gap-2 font-semibold">
              <span className="">MeetingScribe AI</span>
            </a>
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-12">
            <div className="container mx-auto max-w-4xl">
              <Outlet />
            </div>
          </main>
          <footer className="text-center py-6 text-sm text-slate-500 border-t">
            Built with ❤️ at Cloudflare
          </footer>
        </div>
      </div>
    </>
  );
}