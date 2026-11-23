import type { NavIcon } from "@/lib/dashboard-nav";

const paths: Record<NavIcon, string> = {
  home: "M3 11 12 4l9 7M5 10v10h14V10",
  schedule: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  messages: "M4 5h16v11H9l-5 4z",
  training: "M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12",
  nutrition: "M12 7c-3-3-8-1-8 4 0 5 4 9 8 9s8-4 8-9c0-5-5-7-8-4zM12 7c0-2 1-3 3-4",
  progress: "M4 19V5M4 19h16M8 15l4-4 3 3 5-6",
  overview: "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z",
  clients: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 10a2.5 2.5 0 1 0 0-5M17 15c2.5 0 4 1.6 4 4",
  workouts: "M5 4h14v16H5zM9 9h6M9 13h6M9 17h3",
  log: "M12 5v14M5 12h14",
  invite: "M12 5v14M5 12h14",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z",
};

export function Icon({ name, className = "h-5 w-5" }: { name: NavIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
