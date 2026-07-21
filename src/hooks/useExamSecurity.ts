import { useEffect, useCallback, useState, useRef } from 'react';

interface UseExamSecurityOptions {
  enabled: boolean;
  paused?: boolean;
  maxWarnings?: number;
  onWarning?: (count: number, type: string) => void;
  onDisqualify?: (count: number) => void;
}

export const useExamSecurity = ({
  enabled,
  paused = false,
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
      if (paused) return;
      e.preventDefault();
    };

    // Trap & Block System Keyboards, Calculator Buttons, Windows Keys & Function Keys (F1 - F12)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (paused) return;
      const key = e.key || '';
      const code = e.code || '';
      const lowerKey = key.toLowerCase();

      // 1. Dedicated Hardware Calculator Keys
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

      // 2. Windows / Meta / OS Keys & System Launchers
      const isWindowsOrMetaKey =
        key === 'Meta' ||
        key === 'OS' ||
        key === 'Win' ||
        key === 'Windows' ||
        code === 'MetaLeft' ||
        code === 'MetaRight' ||
        code === 'OSLeft' ||
        code === 'OSRight' ||
        e.metaKey ||
        (e.altKey && code === 'Space') || // Windows Search / PowerToys
        (e.ctrlKey && key === 'Escape'); // Start Menu

      // 3. Function Keys (F1 through F12)
      const isFunctionKey = /^F(1[0-2]|[1-9])$/i.test(key) || /^F(1[0-2]|[1-9])$/i.test(code);

      // 4. General forbidden key combinations
      const isForbiddenShortcut =
        (e.ctrlKey && ['c', 'v', 'x', 'u', 'a', 't', 'p'].includes(lowerKey)) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(lowerKey)) ||
        (e.altKey && key === 'Tab') ||
        (e.altKey && key === 'F4') ||
        key === 'PrintScreen';

      if (isCalculatorKey || isWindowsOrMetaKey || isFunctionKey || isForbiddenShortcut) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isCalculatorKey) {
          triggerWarning('System Calculator Key Blocked!');
        } else if (isWindowsOrMetaKey) {
          triggerWarning('Windows / System OS Key Blocked!');
        } else if (isFunctionKey) {
          triggerWarning(`Function Key (${key || code}) Blocked!`);
        }
      }
    };

    // Disable copy/paste/cut
    const handleCopy = (e: ClipboardEvent) => {
      if (paused) return;
      e.preventDefault();
    };
    const handlePaste = (e: ClipboardEvent) => {
      if (paused) return;
      e.preventDefault();
    };
    const handleCut = (e: ClipboardEvent) => {
      if (paused) return;
      e.preventDefault();
    };

    // Detect tab switching
    const handleVisibilityChange = () => {
      if (paused) return;
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
      if (paused) return;
      const now = Date.now();
      if (now - lastBlurTimeRef.current > 1500) {
        lastBlurTimeRef.current = now;
        triggerWarning('Focus lost to external application!');
      }
    };

    // Detect fullscreen changes
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs && enabled && !paused) {
        triggerWarning('Fullscreen exited!');
      }
    };

    // Block page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paused) return;
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
