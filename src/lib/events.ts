/**
 * Tiny window-event bridge so page-header buttons (rendered by the server page) can talk to
 * the client view below them without lifting state into Redux.
 */
export type PageCommand = "export" | "new" | "generate";

const EVENT = "ngas:page-command";

export function emitPageCommand(command: PageCommand) {
  window.dispatchEvent(new CustomEvent<PageCommand>(EVENT, { detail: command }));
}

export function onPageCommand(handler: (command: PageCommand) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<PageCommand>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
