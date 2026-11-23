// After a client-side navigation to "/", force the window to the very top.
// A soft Next.js navigation can keep the old scroll position (the sticky header
// counts as already in view), and html has smooth scrolling, so reset without
// animation and retry briefly while the new page renders.
export function scrollTopSoon() {
  const html = document.documentElement;
  html.style.scrollBehavior = "auto";
  const reset = () => window.scrollTo(0, 0);
  reset();
  [50, 150, 400, 800].forEach((ms) => setTimeout(reset, ms));
  setTimeout(() => (html.style.scrollBehavior = ""), 900);
}
