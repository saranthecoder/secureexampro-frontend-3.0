import { useEffect, useCallback, useState, useRef } from 'react';

interface UseExamSecurityOptions {
  enabled: boolean;
  maxWarnings?: number;
  onWarning?: (count: number, type: string) => void;
  onDisqualify?: (count: number) => void;
}

export const useExamSecurity = ({
  enabled,
  maxWarnings = 3,
  onWarning,
  onDisqualify,
}: UseExamSecurityOptions) => {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const warningCountRef = useRef(0);

  const triggerWarning = useCallback(
    (message: string) => {
      warningCountRef.current += 1;
      const count = warningCountRef.current;
      setTabSwitchCount(count);
      if (count >= maxWarnings) {
        setWarningMessage(`${message} (Disqualified)`);
        onDisqualify?.(count);
      } else {
        setWarningMessage(`${message} (Warning ${count}/${maxWarnings - 1})`);
        setShowWarning(true);
        onWarning?.(count, message);
      }
    },
    [maxWarnings, onWarning, onDisqualify]
  );

  const dismissWarning = useCallback(() => setShowWarning(false), []);

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'u', 'a', 't', 'p'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Disable copy/paste/cut
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();

    // Detect tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerWarning('Tab switch detected!');
      }
    };

    // Detect fullscreen changes
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs && enabled) {
        triggerWarning('Fullscreen exited!');
      }
    };

    // Block page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, triggerWarning]);

  return {
    tabSwitchCount,
    isFullscreen,
    showWarning,
    warningMessage,
    dismissWarning,
    triggerWarning,
    enterFullscreen,
    exitFullscreen,
  };
};
