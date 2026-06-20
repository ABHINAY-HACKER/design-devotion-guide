import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminOverview, isAdmin } from "@/lib/admin.functions";
import { Shield, Users, FileText, MessageSquare, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — ResumeIQ" }] }),
  component: Admin,
});

function Admin() {
  const fetchOverview = useServerFn(getAdminOverview);
  const check = useServerFn(isAdmin);
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    check()
      .then((r) => {
        if (!r.admin) { setState("denied"); return; }
        return fetchOverview().then((d) => { setData(d); setState("ready"); });
      })
      .catch(() => setState("denied"));
  }, [check, fetchOverview]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-muted-foreground">
        <Loader2 className="inline h-5 w-5 animate-spin" /> Loading admin…
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">You don't have permission to view this page.</p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Tile icon={Users} label="Users" value={data.totals.users} />
        <Tile icon={FileText} label="Resume Analyses" value={data.totals.analyses} />
        <Tile icon={MessageSquare} label="Contact Messages" value={data.totals.contacts} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Tile label="Avg Match %" value={`${data.averages.match}%`} />
        <Tile label="Avg ATS %" value={`${data.averages.ats}%`} />
        <Tile label="Avg Strength %" value={`${data.averages.strength}%`} />
      </div>

      <Panel title="Recent users">
        <Table headers={["Email", "Name", "Joined"]}>
          {data.recent_users.map((u: any) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-3 py-2 text-sm">{u.email}</td>
              <td className="px-3 py-2 text-sm">{u.full_name ?? "—"}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel title="Recent analyses">
        <Table headers={["File", "Match", "ATS", "When"]}>
          {data.recent_analyses.map((a: any) => (
            <tr key={a.id} className="border-t border-border">
              <td className="px-3 py-2 text-sm truncate max-w-xs">{a.file_name}</td>
              <td className="px-3 py-2 text-sm">{a.match_score}%</td>
              <td className="px-3 py-2 text-sm">{a.ats_score}%</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel title="Recent contact messages">
        <Table headers={["From", "Subject", "Message", "When"]}>
          {data.recent_messages.map((m: any) => (
            <tr key={m.id} className="border-t border-border align-top">
              <td className="px-3 py-2 text-sm">
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.email}</div>
              </td>
              <td className="px-3 py-2 text-sm">{m.subject ?? "—"}</td>
              <td className="px-3 py-2 text-sm max-w-md whitespace-pre-wrap">{m.message}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </section>
  );
}

function Tile({ icon: Icon, label, value }: { icon?: any; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary" />} {label}
      </div>
      <div className="mt-2 font-heading text-3xl font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-card shadow-card">{children}</div>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="min-w-full text-left">
      <thead className="bg-accent/50">
        <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}