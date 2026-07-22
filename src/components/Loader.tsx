import { useEffect, useState } from "react";

interface LoaderProps {
  message?: string;
}

const messages = [
  "Setting up secure environment...",
  "Verifying credentials...",
  "Loading exam data...",
  "Applying security protocols...",
  "Please wait..."
];

const Loader = ({ message }: LoaderProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
  <div className="flex flex-col items-center text-center">

    {/* Logo + Spinner */}
    <div className="relative flex items-center justify-center">

      {/* Spinner Ring */}
      <div className="absolute h-56 w-56 rounded-full border-[6px] border-emerald-100 border-t-emerald-600 animate-spin"></div>

      {/* Glow */}
      <div className="absolute h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>

      {/* Logo */}
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

  </div>
</div>


  );
};

export default Loader;
