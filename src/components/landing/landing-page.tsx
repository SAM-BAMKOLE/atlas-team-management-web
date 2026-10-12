import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Check,
  Columns3,
  ListTodo,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const lanes = [
  {
    name: "Backlog",
    dot: "bg-muted-foreground",
    tasks: ["Refresh onboarding", "Share Q4 roadmap"],
  },
  {
    name: "In progress",
    dot: "bg-amber-500",
    tasks: ["Board activity feed", "Google OAuth callbacks"],
  },
  {
    name: "Done",
    dot: "bg-emerald-500",
    tasks: ["Workspace roles", "Neon database"],
  },
];

const features = [
  {
    icon: Columns3,
    title: "Kanban boards",
    body: "Every project becomes a board. Add tasks inline and move them between columns in one click.",
  },
  {
    icon: Users,
    title: "Assign the right people",
    body: "Quick-assign teammates straight from a board card or a task list, and unassign just as easily.",
  },
  {
    icon: Tags,
    title: "Labels & due dates",
    body: "Color-coded labels, priorities, and due dates keep every card scannable at a glance.",
  },
  {
    icon: ListTodo,
    title: "One list for everything",
    body: "See every task across a project's boards on a single page — grouped by board, sorted by lane.",
  },
  {
    icon: Archive,
    title: "Archived, not lost",
    body: "Archived tasks stay reachable. Restore one straight back onto its board, or delete it for good.",
  },
  {
    icon: ShieldCheck,
    title: "Clear roles",
    body: "Owners and admins manage the workspace; every member gets exactly the controls they need.",
  },
];

const teamPoints = [
  [
    "Assign tasks to the right person, with priorities and due dates at a glance.",
    "Boards stay in sync no matter where a change was made — board, list, or detail page.",
    "Archived work stays reachable: restore it onto the board or purge it permanently.",
  ],
];

const heroStats = [
  { value: "9", label: "projects" },
  { value: "64", label: "tasks" },
  { value: "12", label: "members" },
];

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground antialiased">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-foreground text-sm font-bold text-background">
              A
            </span>
            <span className="text-lg font-semibold tracking-tight">Atlas</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#features">
              Features
            </a>
            <a className="transition-colors hover:text-foreground" href="#teams">
              For teams
            </a>
            <a className="transition-colors hover:text-foreground" href="#get-started">
              Get started
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/workspaces">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/workspaces">
                Open workspace <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-48 left-1/2 h-[38rem] w-[70rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_9%,transparent),transparent_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0)_55%,var(--background))]" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pt-16 pb-24 lg:grid-cols-2 lg:pt-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Workspaces · Projects · Boards
              </span>
              <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
                All your team&apos;s work, one clear view.
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
                Atlas organizes your workspace into projects and kanban boards,
                so every task, deadline, and teammate lands exactly where it
                belongs — and stays there.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/workspaces">
                    Go to your workspace <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">See what&apos;s inside</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Sign in with your workspace — no setup required.
              </p>
            </div>

            {/* Product mockup */}
            <div className="relative w-full max-w-lg justify-self-center">
              <div
                aria-hidden
                className="absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_70%)] blur-2xl"
              />
              <div className="relative rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/10 dark:shadow-black/40">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Product launch · 12 tasks
                    </p>
                    <h3 className="mt-0.5 truncate text-base font-semibold">
                      Product launch
                    </h3>
                  </div>
                  <div className="flex shrink-0 -space-x-1.5">
                    {["JD", "SK", "AR"].map((initials, i) => (
                      <span
                        key={initials}
                        className={`flex size-6 items-center justify-center rounded-full text-[0.6rem] font-bold ring-2 ring-card ${
                          ["bg-[#dbe4ff] text-[#3d55b9]", "bg-[#ffe6c9] text-[#a15c00]", "bg-[#e3fcef] text-[#0e7c4a]"][i]
                        }`}
                      >
                        {initials}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {lanes.map((lane) => (
                    <div key={lane.name} className="rounded-lg bg-muted/60 p-2">
                      <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-foreground">
                        <span className={`size-1.5 rounded-full ${lane.dot}`} />
                        <span className="truncate">{lane.name}</span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {lane.tasks.map((task) => (
                          <div
                            key={task}
                            className="rounded-md border border-border bg-card px-2 py-1.5 text-[0.68rem] leading-snug text-muted-foreground"
                          >
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-[0.68rem] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Sprint 12 — 3 cards done today
                  <span className="ml-auto flex gap-1">
                    {["LOW", "HIGH", "URGENT"].map((p, i) => (
                      <span
                        key={p}
                        className={`rounded-full px-1.5 py-0.5 text-[0.58rem] font-semibold ${
                          [
                            "bg-muted",
                            "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                            "bg-destructive/10 text-destructive",
                          ][i]
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Stats ---------- */}
        <section className="border-y border-border/70 bg-muted/30">
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-6 px-6 py-10 text-center">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              What Atlas does
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              A workspace that stays out of your way.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              The tools your team already reaches for — boards, tasks,
              assignments — designed to feel effortless.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Photo + teams ---------- */}
        <section id="teams" className="border-t border-border/70 bg-muted/30">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
            <div className="relative order-2 lg:order-1">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
                alt="A team collaborating around a table on a project"
                width={1400}
                height={933}
                className="aspect-[3/2] w-full rounded-2xl border border-border object-cover shadow-lg"
              />
              <div className="absolute right-4 bottom-4 rounded-xl border border-border bg-background/90 px-4 py-3 shadow-md backdrop-blur">
                <p className="text-xs font-medium text-foreground">
                  12 tasks · 4 members · This sprint
                </p>
                <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ 3 done today
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Built for teams
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                From brainstorming to ship day, together.
              </h2>
              <ul className="mt-8 space-y-5">
                {teamPoints[0].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3.5" />
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-8">
                <Link href="/workspaces">
                  Open a project <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section id="get-started" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-center text-background sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.14),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to map your next project?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground [color:color-mix(in_oklch,var(--background)_70%,transparent)]">
                Open your workspace — boards, tasks, and teammates are already
                waiting for you there.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" variant="secondary" className="[&_svg]:text-background">
                  <Link href="/workspaces">
                    Go to workspace <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-background hover:bg-white/10 hover:text-background dark:hover:bg-white/10">
                  <a href="#features">Learn more</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
              A
            </span>
            <span className="text-sm font-semibold">Atlas</span>
            <span className="text-sm text-muted-foreground">
              © 2026 Atlas
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link className="transition-colors hover:text-foreground" href="/workspaces">
              Workspace
            </Link>
            <Link className="transition-colors hover:text-foreground" href="/workspaces">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}