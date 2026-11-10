"use client";

import { useEffect, useRef } from "react";
import { onPageCommand, type PageCommand } from "@/lib/events";

export function usePageCommand(command: PageCommand, handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => onPageCommand((c) => c === command && ref.current()), [command]);
}
