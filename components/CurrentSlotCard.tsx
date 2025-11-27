import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../types';
import { BookOpen, User, Clock as ClockIcon, Coffee } from 'lucide-react';

interface CurrentSlotCardProps {
  schedule: ScheduleItem[];
}

export const CurrentSlotCard: React.FC<CurrentSlotCardProps> = ({ schedule }) => {
  // Estado para forçar atualização a cada segundo e garantir troca de turno automática
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  // Pad manually to match "HH:mm" format in types.ts (e.g. "07:20")
  const hoursStr = currentHour.toString().padStart(2, '0');
  const minutesStr = now.getMinutes().toString().padStart(2, '0');
  const currentTimeString = `${hoursStr}:${minutesStr}`;
  
  const currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)

  // Determine Shift: Morning is strictly before 12:30
  // 12:29:59 -> Morning
  // 12:30:00 -> Afternoon
  const isMorning = currentHour < 12 || (currentHour === 12 && now.getMinutes() < 30);

  // Define Columns based on Shift - Exact matches with AdminPanel fixed classes
  const columns = isMorning 
    ? [
        { title: '6º EFAF', match: ['6º efaf', '6º ano'] },
        { title: '7º EFAF', match: ['7º efaf', '7º ano'] },
        { title: '8º EFAF', match: ['8º efaf', '8º ano'] },
        { title: '9º EFAF', match: ['9º efaf', '9º ano'] }
      ]
    : [
        { title: '1ª SÉRIE EM', match: ['1ª série', '1ª em', '1a série'] },
        { title: '2ª SÉRIE EM', match: ['2ª série', '2ª em', '2a série'] },
        { title: '3ª SÉRIE EM', match: ['3ª série', '3ª em', '3a série'] }
      ];

  // Helper to find the active slot for a specific column match
  const getActiveSlotForColumn = (matchers: string[]) => {
    return schedule.find(item => {
        // 1. Must be today
        if (item.dayOfWeek !== currentDay) return false;

        // 2. Must be current time interval
        // Comparison works lexicographically for "HH:mm"
        if (currentTimeString >= item.startTime && currentTimeString < item.endTime) {
            const classNameLower = item.className.toLowerCase();
            return matchers.some(m => classNameLower.includes(m));
        }
        return false;
    });
  };

  return (
    <div className="w-full h-full flex flex-col animate-fade-in-up">
      
      {/* Shift Label */}
      <div className="flex justify-center mb-4 shrink-0">
        <span className={`px-6 py-1 rounded-full font-mono text-xs tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(220,38,38,0.2)] backdrop-blur-sm border ${isMorning ? 'bg-yellow-950/40 text-yellow-200 border-yellow-900/50' : 'bg-indigo-950/40 text-indigo-200 border-indigo-900/50'}`}>
            Turno da {isMorning ? 'Manhã' : 'Tarde'}
        </span>
      </div>

      {/* Grid Container */}
      <div className={`flex-1 grid gap-4 h-full ${isMorning ? 'grid-cols-4' : 'grid-cols-3'}`}>
        
        {columns.map((col, index) => {
            const slot = getActiveSlotForColumn(col.match);
            const isBreak = slot?.isBreak;

            return (
                <div key={index} className="relative group h-full overflow-hidden">
                    {/* Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-red-600 to-red-900 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    
                    <div className="relative h-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl backdrop-blur-xl">
                        
                        {/* Header: Class Name */}
                        <div className="border-b border-red-900/30 pb-2 mb-2 flex justify-between items-center shrink-0">
                            <h3 className="text-lg lg:text-xl font-bold text-white uppercase tracking-wider truncate">{col.title}</h3>
                            {slot && (
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                    {slot.startTime}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                            {slot ? (
                                isBreak ? (
                                    <div className="flex flex-col items-center justify-center space-y-2 animate-pulse">
                                        <Coffee className="w-8 h-8 lg:w-12 lg:h-12 text-yellow-500" />
                                        <span className="text-lg lg:text-2xl font-bold text-yellow-100 uppercase tracking-widest">Intervalo</span>
                                        <span className="text-xs text-yellow-500/70 font-mono">{slot.startTime} - {slot.endTime}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full justify-evenly w-full">
                                        {/* Subject */}
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 text-red-400/70 text-[10px] uppercase font-bold tracking-wider mb-1">
                                                <BookOpen size={12} />
                                                Disciplina
                                            </div>
                                            <div className="text-xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 leading-tight break-words w-full">
                                                {slot.subject || "---"}
                                            </div>
                                        </div>

                                        {/* Teacher */}
                                        <div className="flex flex-col items-center pt-2 border-t border-slate-800/50 w-full">
                                            <div className="flex items-center gap-1 text-red-400/70 text-[10px] uppercase font-bold tracking-wider mb-1">
                                                <User size={12} />
                                                Professor(a)
                                            </div>
                                            <div className="text-base lg:text-xl font-medium text-slate-200 truncate w-full px-2">
                                                {slot.teacherName || "---"}
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-600 space-y-2">
                                    <ClockIcon size={32} className="opacity-20" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Sem Aula</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}

      </div>
    </div>
  );
};