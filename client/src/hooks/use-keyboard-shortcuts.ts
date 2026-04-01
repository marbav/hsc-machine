import { useEffect, useState } from "react";

interface ShortcutHandlers {
  onNext?: () => void;
  onReveal?: () => void;
  onRate?: (rating: number) => void;
  onFlag?: () => void;
  onDifficultyEasy?: () => void;
  onDifficultyMedium?: () => void;
  onDifficultyHard?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      // Don't interfere with modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          handlers.onNext?.();
          break;
        case "r":
          e.preventDefault();
          handlers.onReveal?.();
          break;
        case "f":
          e.preventDefault();
          handlers.onFlag?.();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          e.preventDefault();
          handlers.onRate?.(parseInt(e.key));
          break;
        case "e":
          e.preventDefault();
          handlers.onDifficultyEasy?.();
          break;
        case "m":
          e.preventDefault();
          handlers.onDifficultyMedium?.();
          break;
        case "h":
          e.preventDefault();
          handlers.onDifficultyHard?.();
          break;
        case "?":
          e.preventDefault();
          setShowHelp(prev => !prev);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);

  return { showHelp, setShowHelp };
}
