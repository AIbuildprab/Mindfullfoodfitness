// Layout contract: DASHBOARD_LAYOUT.md. Navigation only — no data.

export type NavIcon =
  | "home" | "schedule" | "messages" | "training" | "nutrition" | "progress"
  | "overview" | "clients" | "workouts" | "log" | "invite" | "settings";

export type NavItem = { id: string; label: string; short: string; icon: NavIcon };

export const clientNav: NavItem[] = [
  { id: "home", label: "Home", short: "Home", icon: "home" },
  { id: "schedule", label: "Schedule", short: "Sched", icon: "schedule" },
  { id: "messages", label: "Messages", short: "Msgs", icon: "messages" },
  { id: "training", label: "Training", short: "Train", icon: "training" },
  { id: "nutrition", label: "Nutrition", short: "Nutri", icon: "nutrition" },
  { id: "progress", label: "Progress", short: "Prog", icon: "progress" },
];

export const coachNav: NavItem[] = [
  { id: "overview", label: "Overview", short: "Overview", icon: "overview" },
  { id: "schedule", label: "Schedule", short: "Sched", icon: "schedule" },
  { id: "messages", label: "Messages", short: "Msgs", icon: "messages" },
  { id: "clients", label: "Clients", short: "Clients", icon: "clients" },
  { id: "nutrition", label: "Nutrition", short: "Nutri", icon: "nutrition" },
  { id: "workouts", label: "Workouts", short: "Workouts", icon: "workouts" },
];

export const clientTabIds = clientNav.map((n) => n.id);
export const coachViewIds = [...coachNav.map((n) => n.id), "training-log"];
