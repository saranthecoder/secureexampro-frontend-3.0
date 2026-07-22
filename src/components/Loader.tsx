import { useEffect, useState } from "react";

interface LoaderProps {
  message?: string;
  countdown?: number;
  countdownTotal?: number;
}

const messages = [
  "Setting up secure environment...",
  "Verifying credentials...",
  "Loading exam data...",
  "Applying security protocols...",
  "Please wait..."
];

const Loader = ({ message, countdown, countdownTotal }: LoaderProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Extract seconds from message pattern like "(Xs remaining)" for auto-countdown display
  const extractedCountdown = (() => {
    if (countdown !== undefined) return countdown;
    if (!message) return null;
    const match = message.match(/\((\d+)s? remaining\)/);
    return match ? parseInt(match[1], 10) : null;
  })();

  const hasCountdown = extractedCountdown !== null && extractedCountdown >= 0;

  // SVG circle properties for countdown ring
  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const total = countdownTotal || 30;
  const progressOffset = hasCountdown
    ? circleCircumference * (1 - extractedCountdown / total)
    : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center text-center">

        {hasCountdown ? (
          <>
            {/* Countdown Timer Display */}
            <div className="relative flex items-center justify-center">
              {/* Background glow */}
              <div className="absolute h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>

              {/* SVG Countdown Ring */}
              <svg className="h-56 w-56 -rotate-90" viewBox="0 0 160 160">
                {/* Track ring */}
                <circle
                  cx="80" cy="80" r={circleRadius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                {/* Progress ring */}
                <circle
                  cx="80" cy="80" r={circleRadius}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={progressOffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Countdown number in center */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-800 font-mono tabular-nums">
                  {extractedCountdown}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                  seconds
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center max-w-xs">
              <p className="text-blue-600 font-bold text-sm">
                {message || "Queued to prevent server overload..."}
              </p>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                To ensure a smooth experience for all students, requests are processed in secure batches.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]"></span>
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Default Loader (no countdown) */}
            <div className="relative flex items-center justify-center">
              <div className="absolute h-56 w-56 rounded-full border-[6px] border-emerald-100 border-t-emerald-600 animate-spin"></div>
              <div className="absolute h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
              <img
                src="/logo.png"
                alt="SecureExam Logo"
                className="h-32 w-32 object-contain z-10"
              />
            </div>

            <div className="mt-20 flex flex-col items-center">
              <p className="text-emerald-600 font-semibold text-sm">
                {message || messages[index]}
              </p>
              <div className="mt-3 flex gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]"></span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Loader;
