import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logoAsset from "@/assets/resumeiq-logo.png.asset.json";
import { UserMenu } from "./UserMenu";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/resume-analysis", label: "Resume Analysis" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/contact", label: "Contact" },
];

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const { location } = useRouterState();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="ResumeIQ logo" className="h-10 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="nav-link"
                activeProps={{ className: "nav-link active" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <UserMenu />
            <Link to="/resume-analysis" className="btn-primary text-sm">Get Started</Link>
          </div>
          <button
            className="md:hidden rounded-md p-2 text-foreground"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="flex flex-col gap-1 px-6 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-primary"
                  activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium bg-accent text-primary" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/resume-analysis" className="btn-primary mt-3 justify-center text-sm">Get Started</Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-foreground text-background/90">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <img src={logoAsset.url} alt="ResumeIQ" className="h-10 w-auto bg-white rounded-md p-1" />
            </div>
            <p className="mt-4 max-w-sm text-sm text-background/70">
              AI-powered resume analysis and job matching platform helping students and job seekers land their dream roles.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-background">Navigation</h4>
            <ul className="mt-4 space-y-2 text-sm text-background/70">
              {navItems.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-background">{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-background">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-background/70">
              <li>resumeiq.helpdesk@gmail.com</li>
              <li>+91 63053 34148</li>
              <li>Suryapet, Telangana, India</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10">
          <p className="mx-auto max-w-7xl px-6 py-5 text-center text-xs text-background/60">
            © {new Date().getFullYear()} ResumeIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
