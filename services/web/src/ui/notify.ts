// Reward notifications (owner: package 2): toasts for cards and badges, banner for level up.
import { el } from "./dom";
import type { RewardEvent } from "./hud";

/** Remove the element when its CSS fade-out ends; durations live in ui.css. */
function onFadedOut(node: HTMLElement, then?: () => void): void {
  node.addEventListener("animationend", (e) => {
    if (e.animationName !== "fade-out") return;
    node.remove();
    then?.();
  });
}

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
    onFadedOut(banner, nextBanner);
    root.append(banner);
  };

  const toast = (text: string) => {
    const t = el("div", { className: "toast" }, text);
    onFadedOut(t);
    toasts.append(t);
  };

  return (events: RewardEvent[]) => {
    for (const e of events) {
      if (e.kind === "level") bannerQueue.push(e.text);
      else toast(e.text);
    }
    if (!showingBanner) nextBanner();
  };
}
