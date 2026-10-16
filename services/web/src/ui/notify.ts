// Reward notifications (owner: package 2): toasts for cards and badges, banner for level up.
import { el } from "./dom";
import type { RewardEvent } from "./hud";

const TOAST_MS = 4000;
const BANNER_MS = 2500;

export function createNotifier(root: HTMLElement) {
  const toasts = el("div", { className: "toasts" });
  root.append(toasts);

  const bannerQueue: string[] = [];
  let showingBanner = false;

  const nextBanner = () => {
    const text = bannerQueue.shift();
    if (text === undefined) {
      showingBanner = false;
      return;
    }
    showingBanner = true;
    const banner = el("div", { className: "banner" }, text);
    root.append(banner);
    setTimeout(() => {
      banner.remove();
      nextBanner();
    }, BANNER_MS);
  };

  const toast = (text: string) => {
    const t = el("div", { className: "toast" }, text);
    toasts.append(t);
    setTimeout(() => t.remove(), TOAST_MS);
  };

  return (events: RewardEvent[]) => {
    for (const e of events) {
      if (e.kind === "level") bannerQueue.push(e.text);
      else toast(e.text);
    }
    if (!showingBanner) nextBanner();
  };
}
