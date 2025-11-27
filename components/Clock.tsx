import React, { useEffect, useState } from 'react';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in py-2">
      <div className="text-[18vh] leading-none font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300 drop-shadow-[0_0_25px_rgba(220,38,38,0.4)] tracking-tighter">
        {formatTime(time)}
      </div>
      <div className="text-[2.5vh] font-light text-red-200/60 uppercase tracking-widest border-b border-red-900/50 px-12">
        {formatDate(time)}
      </div>
    </div>
  );
};