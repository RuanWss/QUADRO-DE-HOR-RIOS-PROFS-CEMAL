import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { ScheduleItem } from '../types';

// SUAS CREDENCIAIS DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAO9x8YDYqauALigdwn88sIH0mz4o1dkq8",
  authDomain: "quadro-de-horarios-cemal.firebaseapp.com",
  // A URL deve ser exata. Adicionamos o sufixo padrão.
  databaseURL: "https://quadro-de-horarios-cemal-default-rtdb.firebaseio.com", 
  projectId: "quadro-de-horarios-cemal",
  storageBucket: "quadro-de-horarios-cemal.firebasestorage.app",
  messagingSenderId: "938230155772",
  appId: "1:938230155772:web:233c1988be79c58ad7ca79",
  measurementId: "G-X4GRDELC5Q"
};

// Variáveis globais para armazenar a instância
let app;
let db;

try {
    console.log("Iniciando conexão com Firebase...");
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase conectado com sucesso!");
} catch (e) {
    console.error("ERRO GRAVE AO CONECTAR FIREBASE:", e);
    // Não usamos alert aqui para não travar o carregamento inicial se for apenas um delay
}

// --- FUNÇÃO DE AUXÍLIO PARA REINICIALIZAÇÃO MANUAL ---
export const initFirebaseManually = (customUrl: string) => {
    try {
        const config = { ...firebaseConfig, databaseURL: customUrl };
        // Deleta instância anterior se possível (hack para SPA simples)
        const newApp = initializeApp(config, 'manual-' + Date.now()); 
        db = getDatabase(newApp);
        console.log("Reconectado manualmente na URL:", customUrl);
        return true;
    } catch (e) {
        console.error("Falha ao reconectar:", e);
        return false;
    }
};

// --- SERVIÇOS DE DADOS (HORÁRIOS) ---

export const subscribeToSchedule = (callback: (data: ScheduleItem[]) => void) => {
  if (!db) return () => {};
  
  const scheduleRef = ref(db, 'school_schedule');
  
  return onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || []);
  }, (error) => {
    console.error("ERRO DE PERMISSÃO FIREBASE:", error);
    window.dispatchEvent(new CustomEvent('firebase-error', { detail: error.message }));
  });
};

export const updateSchedule = async (newSchedule: ScheduleItem[]) => {
  if (!db) return;
  const scheduleRef = ref(db, 'school_schedule');
  await set(scheduleRef, newSchedule);
};

// --- SERVIÇOS DE DADOS (CADASTROS/REGISTRY) ---

export interface RegistryItem {
    subject: string;
    teachers: string[];
}

export const subscribeToRegistry = (callback: (data: RegistryItem[]) => void) => {
  if (!db) return () => {};
  
  const registryRef = ref(db, 'school_registry_linked');
  
  return onValue(registryRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || []);
  }, (error) => {
    console.error("Erro ao ler cadastros:", error);
  });
};

export const updateRegistry = async (newRegistry: RegistryItem[]) => {
  if (!db) return;
  const registryRef = ref(db, 'school_registry_linked');
  await set(registryRef, newRegistry);
};