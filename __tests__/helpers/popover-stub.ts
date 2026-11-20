/**
 * jsdom は Popover API を実装していないため、開閉状態の管理と toggle イベントの発火だけを再現する。
 * popovertarget を持つボタンのクリックでも開閉するようにする（ブラウザの invoker の挙動に合わせる）。
 */
export function installPopoverStub(): void {
  const proto = HTMLElement.prototype as HTMLElement & { __popoverStub?: boolean };
  if (typeof proto.togglePopover === "function") return;

  const openElements = new WeakSet<HTMLElement>();
  const fire = (el: HTMLElement, newState: "open" | "closed") => {
    const event = new Event("toggle");
    Object.assign(event, { newState, oldState: newState === "open" ? "closed" : "open" });
    el.dispatchEvent(event);
  };

  proto.showPopover = function (this: HTMLElement) {
    if (openElements.has(this)) return;
    openElements.add(this);
    fire(this, "open");
  };
  proto.hidePopover = function (this: HTMLElement) {
    if (!openElements.has(this)) return;
    openElements.delete(this);
    fire(this, "closed");
  };
  proto.togglePopover = function (this: HTMLElement) {
    if (openElements.has(this)) this.hidePopover();
    else this.showPopover();
    return openElements.has(this);
  };

  document.addEventListener("click", (event) => {
    const invoker = (event.target as Element | null)?.closest?.("[popovertarget]");
    if (!invoker) return;
    const target = document.getElementById(invoker.getAttribute("popovertarget")!);
    target?.togglePopover();
  });
}
