"use client";

import { useState } from "react";
import styles from "./page.module.css";

const columns = [
  ["Backlog", "#64748b", ["Invite design partners"]],
  ["In progress", "#f59e0b", ["Workspace permissions", "Board activity feed"]],
  ["Review", "#8b5cf6", ["Google OAuth callback"]],
  ["Done", "#10b981", ["Neon database setup", "Email provider adapter"]],
] as const;

export default function Home() {
  const [view, setView] = useState("Board");
  const [composer, setComposer] = useState(false);
  return <main className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><span className={styles.mark}>A</span><strong>Atlas</strong></div>
      <div className={styles.workspace}><span className={styles.workspaceIcon}>N</span>Northstar Team <span className={styles.chevron}>⌄</span></div>
      <nav className={styles.nav}>{["Overview", "My tasks", "Board", "Roadmap"].map((item) => <button className={view === item ? styles.navActive : ""} key={item} onClick={() => setView(item)}><span>{item === "Board" ? "▦" : item === "Overview" ? "⌂" : item === "My tasks" ? "✓" : "◒"}</span>{item}</button>)}</nav>
      <div className={styles.sectionLabel}>Workspace</div><nav className={styles.nav}><button><span>♙</span>Members <small>8</small></button><button><span>⚙</span>Settings</button></nav>
      <div className={styles.sidebarFooter}><span className={styles.avatar}>AM</span><div><b>Alex Morgan</b><small>alex@example.com</small></div><span>⋯</span></div>
    </aside>
    <section className={styles.content}>
      <header className={styles.topbar}><div className={styles.breadcrumb}>Projects <b>/</b> <strong>Product launch</strong></div><div className={styles.topActions}>⌕　♧ <span className={styles.avatar}>AM</span></div></header>
      <div className={styles.pageHeader}><div><div className={styles.eyebrow}>PRODUCT LAUNCH　•　12 TASKS</div><h1>Product launch</h1><p>Coordinate the launch with your team in one shared workspace.</p></div><button className={styles.primaryButton} onClick={() => setComposer(true)}>＋ Add task</button></div>
      <div className={styles.toolbar}><div className={styles.tabs}>{["Board", "List", "Activity"].map((item) => <button className={view === item ? styles.tabActive : ""} key={item} onClick={() => setView(item)}>{item}</button>)}</div><div className={styles.filters}><button>⌕ Filter</button><button>⇅ Sort</button><button>JD　SK　+2</button></div></div>
      {view === "Board" ? <div className={styles.board}>{columns.map(([title, color, tasks]) => <section className={styles.column} key={title}><div className={styles.columnHeader}><div><i style={{ background: color }} />{title}<small>{tasks.length}</small></div><button>＋</button></div>{tasks.map((task) => <article className={styles.card} key={task}><em>{task.includes("OAuth") ? "Security" : task.includes("Neon") ? "Infrastructure" : "Product"}</em><h3>{task}</h3><footer><span>◷ {title === "Done" ? "Completed" : "Oct 14"}</span><span className={styles.miniAvatar}>AM</span></footer></article>)}</section>)}</div> : <div className={styles.emptyState}><div>◴</div><h2>{view} view is ready</h2><p>Switch back to Board to manage launch tasks visually.</p></div>}
    </section>
    {composer && <div className={styles.backdrop} onClick={() => setComposer(false)}><div className={styles.modal} onClick={(e) => e.stopPropagation()}><header><h2>Create a task</h2><button onClick={() => setComposer(false)}>×</button></header><label>Task name<input autoFocus placeholder="What needs to be done?" /></label><label>Column<select><option>Backlog</option><option>In progress</option><option>Review</option></select></label><footer><button onClick={() => setComposer(false)}>Cancel</button><button className={styles.primaryButton} onClick={() => setComposer(false)}>Create task</button></footer></div></div>}
  </main>;
}
