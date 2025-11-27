import React, { useState, useEffect, useRef } from 'react';
import { Clock } from './components/Clock';
import { CurrentSlotCard } from './components/CurrentSlotCard';
import { AdminPanel } from './components/AdminPanel';
import { ScheduleOverviewModal } from './components/ScheduleOverviewModal';
import { ScheduleItem, ViewMode, MORNING_SLOTS, AFTERNOON_SLOTS } from './types';
import { subscribeToSchedule } from './services/firebaseConfig';
import { Settings, Lock, X, Calendar } from 'lucide-react';

// Default calm chime sound
const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  
  // SCHEDULE STATE: Controlled by Firebase
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState(false);
  
  // Overview Modal State
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  
  // Ref to track if we already played the sound for a specific timestamp to avoid loops
  const lastPlayedRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- FIREBASE SUBSCRIPTION ---
  useEffect(() => {
    // Connect to Realtime Database
    const unsubscribe = subscribeToSchedule((data) => {
      setSchedule(data);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    audioRef.current = new Audio(ALERT_SOUND_URL);
    audioRef.current.volume = 0.5;
  }, []);

  const playAlert = (duration = 2000) => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play failed (interaction needed):", e));
        
        // Stop after specified duration
        setTimeout(() => {
            if(audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }, duration);
    }
  };

  // Helper to get strictly formatted HH:mm string
  const getFormattedTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Main tick loop for audio alerts
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const day = now.getDay(); // 0-6
      const currentTimeString = getFormattedTime(now);

      const allSlots = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

      // Combine all start times AND end times from fixed slots
      const allTriggerTimes = new Set([
        ...allSlots.map(s => s.start),
        ...allSlots.map(s => s.end)
      ]);

      // Check if current time is a trigger time
      if (allTriggerTimes.has(currentTimeString)) {
        const uniqueKey = `${day}-${currentTimeString}`;
        
        // Prevent double playing in the same minute
        if (lastPlayedRef.current !== uniqueKey) {
            console.log("Sinal Escolar Acionado:", currentTimeString);
            
            // Check if this is the END of a break/interval
            const isIntervalEnd = allSlots.some(s => s.isBreak && s.end === currentTimeString);
            
            // 4 seconds for end of interval, 2 seconds for everything else
            const duration = isIntervalEnd ? 4000 : 2000;
            
            playAlert(duration);
            lastPlayedRef.current = uniqueKey;
        }
      }
    };

    // Check every second to capture the exact minute change
    const timer = setInterval(checkTime, 1000);
    checkTime(); // Initial check

    return () => clearInterval(timer);
  }, []); 

  const handleAdminClick = () => {
      setShowAuthModal(true);
      setPinInput("");
      setAuthError(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (pinInput === "2016") {
          setShowAuthModal(false);
          setViewMode(ViewMode.ADMIN);
      } else {
          setAuthError(true);
          setPinInput("");
      }
  };

  return (
    <div className="h-screen w-screen bg-black text-slate-100 font-sans selection:bg-red-500/30 overflow-hidden relative flex flex-col">
      
      {/* Background Ambient Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950 via-black to-black opacity-80"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-900/30 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-800/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Content Area - Flex layout to fit screen */}
      <main className="flex-1 flex flex-col relative z-10 w-full max-w-[1920px] mx-auto px-4 py-2 min-h-0">
          
          {/* Top Section: Logo & Clock */}
          <div className="flex flex-col items-center justify-center shrink-0">
              <div className="h-[10vh] flex items-center justify-center">
                <img 
                    src="https://i.ibb.co/kgxf99k5/LOGOS-10-ANOS-BRANCA-E-VERMELHA.png" 
                    alt="Logo 10 Anos" 
                    className="h-full w-auto object-contain drop-shadow-[0_4px_20px_rgba(220,38,38,0.3)]"
                />
              </div>
              <div className="shrink-0">
                  <Clock />
              </div>
          </div>
          
          {/* Schedule Grid - Takes remaining space */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center py-2">
              <CurrentSlotCard schedule={schedule} />
          </div>

          {/* Prominent Overview Button - Compact */}
          <div className="shrink-0 w-full flex justify-center py-4 z-20">
              <button 
                  onClick={() => setShowOverviewModal(true)}
                  className="flex items-center gap-4 bg-gradient-to-r from-red-900 via-red-800 to-red-900 hover:from-red-700 hover:via-red-600 hover:to-red-700 text-white px-8 py-3 rounded-full border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.25)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all duration-300 transform hover:-translate-y-1 group"
              >
                  <div className="p-2 bg-black/40 rounded-full group-hover:bg-black/60 transition-colors border border-red-500/20">
                      <Calendar size={24} className="text-red-200" />
                  </div>
                  <div className="flex flex-col items-start">
                      <span className="text-[10px] text-red-300 font-mono tracking-[0.2em] uppercase leading-none mb-1">Visualizar</span>
                      <span className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-red-100 leading-none">
                        QUADRO GERAL
                      </span>
                  </div>
              </button>
          </div>
      </main>

      {/* Footer / Controls - Very compact */}
      <footer className="px-4 py-2 flex justify-between items-center shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent z-20 h-[5vh]">
          <div className="text-red-900/50 text-[10px] font-mono">
              v2.1 (Online)
          </div>
          
          <button 
              onClick={handleAdminClick}
              className="group flex items-center gap-2 text-slate-700 hover:text-red-400 transition-all opacity-50 hover:opacity-100"
          >
              <Settings size={14} />
          </button>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-red-900/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full relative">
                <button 
                    onClick={() => setShowAuthModal(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-3">
                        <Lock className="text-red-500" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Acesso Restrito</h3>
                    <p className="text-slate-400 text-sm mt-1">Área da Coordenação</p>
                </div>

                <form onSubmit={handlePinSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <input 
                            type="password" 
                            value={pinInput}
                            onChange={(e) => {
                                setPinInput(e.target.value);
                                setAuthError(false);
                            }}
                            placeholder=""
                            className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-4 text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all text-center tracking-[0.5em] text-xl placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-base font-mono"
                            autoFocus
                        />
                        {authError && (
                            <div className="text-red-500 text-xs text-center font-semibold bg-red-500/10 py-1 rounded">
                                PIN Incorreto. Tente novamente.
                            </div>
                        )}
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-red-900/20 active:scale-95"
                    >
                        Acessar Painel
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Admin Panel */}
      {viewMode === ViewMode.ADMIN && (
          <AdminPanel 
            schedule={schedule} 
            setSchedule={setSchedule} 
            onClose={() => setViewMode(ViewMode.DASHBOARD)} 
          />
      )}

      {/* Overview Modal */}
      {showOverviewModal && (
        <ScheduleOverviewModal 
          schedule={schedule}
          onClose={() => setShowOverviewModal(false)}
        />
      )}

    </div>
  );
};

export default App;