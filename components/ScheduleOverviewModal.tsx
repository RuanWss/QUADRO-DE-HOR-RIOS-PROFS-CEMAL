import React, { useState } from 'react';
import { ScheduleItem, DAYS_OF_WEEK, MORNING_SLOTS, AFTERNOON_SLOTS, FIXED_MORNING_CLASSES, FIXED_AFTERNOON_CLASSES } from '../types';
import { X, Sun, Moon, Calendar } from 'lucide-react';

interface ScheduleOverviewModalProps {
  schedule: ScheduleItem[];
  onClose: () => void;
}

type Shift = 'MORNING' | 'AFTERNOON';

export const ScheduleOverviewModal: React.FC<ScheduleOverviewModalProps> = ({ schedule, onClose }) => {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 1 : new Date().getDay());
  
  // Set default shift based on 12:30 PM threshold
  const [selectedShift, setSelectedShift] = useState<Shift>(() => {
    const now = new Date();
    const isAfternoon = now.getHours() > 12 || (now.getHours() === 12 && now.getMinutes() >= 30);
    return isAfternoon ? 'AFTERNOON' : 'MORNING';
  });

  const slots = selectedShift === 'MORNING' ? MORNING_SLOTS : AFTERNOON_SLOTS;
  const classes = selectedShift === 'MORNING' ? FIXED_MORNING_CLASSES : FIXED_AFTERNOON_CLASSES;

  const getCellContent = (className: string, startTime: string) => {
    return schedule.find(
      item => 
        item.dayOfWeek === selectedDay && 
        item.className === className && 
        item.startTime === startTime
    );
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-slate-800 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="text-red-500" />
              Visão Geral
            </h2>
            <p className="text-slate-400 text-sm">Quadro completo de horários</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row bg-slate-900 border-b border-slate-700 shrink-0">
          {/* Shift Toggle */}
          <div className="flex w-full md:w-auto border-b md:border-b-0 md:border-r border-slate-700">
            <button 
              onClick={() => setSelectedShift('MORNING')}
              className={`flex-1 md:flex-none px-8 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${selectedShift === 'MORNING' ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Sun size={18} /> Manhã
            </button>
            <button 
              onClick={() => setSelectedShift('AFTERNOON')}
              className={`flex-1 md:flex-none px-8 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${selectedShift === 'AFTERNOON' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Moon size={18} /> Tarde
            </button>
          </div>

          {/* Days */}
          <div className="flex-1 overflow-x-auto flex scrollbar-hide">
            {DAYS_OF_WEEK.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx + 1)}
                className={`px-6 py-4 whitespace-nowrap text-sm font-semibold transition-colors border-b-2 ${
                  selectedDay === idx + 1
                    ? 'border-red-500 text-white bg-slate-800' 
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-0 bg-slate-900">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-800/90 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32 border-b border-slate-600 bg-slate-800">Horário</th>
                {classes.map(cls => (
                  <th key={cls} className="p-4 text-xs font-bold text-white uppercase tracking-wider border-b border-slate-600 text-center border-l border-slate-700 bg-slate-800">
                    {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {slots.map((slot, idx) => (
                <tr key={idx} className={slot.isBreak ? 'bg-slate-800/40' : 'hover:bg-slate-800/20 transition-colors'}>
                  <td className="p-4 border-r border-slate-800 bg-slate-900/50 sticky left-0 font-mono text-sm text-slate-400 font-bold whitespace-nowrap">
                    {slot.start} - {slot.end}
                    <div className="text-[10px] text-slate-600 font-sans uppercase font-normal mt-1">{slot.name}</div>
                  </td>
                  
                  {classes.map(cls => {
                    const data = getCellContent(cls, slot.start);
                    
                    if (slot.isBreak) {
                      return (
                        <td key={cls} className="p-2 border-l border-slate-800 text-center">
                           <span className="text-yellow-600/50 text-xs font-bold tracking-widest uppercase">Intervalo</span>
                        </td>
                      );
                    }

                    return (
                      <td key={cls} className="p-3 border-l border-slate-800 align-top">
                        {data && (data.subject || data.teacherName) ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-white text-sm block">{data.subject || '---'}</span>
                            <span className="text-xs text-slate-400 block">{data.teacherName || '-'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-700 text-xs italic">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
