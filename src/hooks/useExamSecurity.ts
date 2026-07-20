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
  const lastBlurTimeRef = useRef(0);

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

    // Trap & Block System Keyboards, Calculator Buttons & Forbidden Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      const lowerKey = key ? key.toLowerCase() : '';

      // 1. Dedicated Hardware Calculator Keys (Windows, Mac, Linux keyboards)
      const isCalculatorKey =
        key === 'LaunchCalculator' ||
        code === 'LaunchCalculator' ||
        key === 'Calculator' ||
        code === 'Calculator' ||
        code === 'KeyCalculator' ||
        key === 'LaunchApp2' ||
        code === 'LaunchApp2' ||
        key === 'Calc' ||
        code === 'Calc';

      // 2. OS App Launchers & System Shortcuts (Meta/Win key, Spotlight, Run)
      const isSystemLauncher =
        key === 'Meta' ||
        key === 'OS' ||
        code === 'MetaLeft' ||
        code === 'MetaRight' ||
        (e.metaKey && code === 'Space') || // Mac Spotlight
        (e.altKey && code === 'Space') ||  // Windows PowerToys / Search
        (e.metaKey && lowerKey === 'r') ||   // Run dialog
        (e.ctrlKey && key === 'Escape');    // Start Menu

      // 3. General forbidden key combinations
      const isForbiddenShortcut =
        (e.ctrlKey && ['c', 'v', 'x', 'u', 'a', 't', 'p'].includes(lowerKey)) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(lowerKey)) ||
        key === 'F12' ||
        (e.altKey && key === 'Tab') ||
        (e.altKey && key === 'F4') ||
        key === 'PrintScreen';

      if (isCalculatorKey || isSystemLauncher || isForbiddenShortcut) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isCalculatorKey) {
          triggerWarning('System Calculator Key Blocked! Please use the in-app calculator.');
        } else if (isSystemLauncher) {
          triggerWarning('System App Launcher / OS Key Blocked!');
        }
      }
    };

    // Disable copy/paste/cut
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();

    // Detect tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastBlurTimeRef.current > 1500) {
          lastBlurTimeRef.current = now;
          triggerWarning('Tab switch / background app detected!');
        }
      }
    };

    // Detect focus loss to external applications (e.g. System Calculator)
    const handleWindowBlur = () => {
      const now = Date.now();
      if (now - lastBlurTimeRef.current > 1500) {
        lastBlurTimeRef.current = now;
        triggerWarning('Focus lost to external application (e.g. System Calculator)!');
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
    document.addEventListener('keyup', handleKeyDown, true);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyDown, true);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
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
