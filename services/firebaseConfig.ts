import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { ScheduleItem } from '../types';

// --- CONFIGURAÇÃO DO FIREBASE ---
// Se o site ficar travado em "Carregando...", verifique se as Regras do Realtime Database estão como "true" no console.
const firebaseConfig = {
  apiKey: "AIzaSyAO9x8YDYqauALigdwn88sIH0mz4o1dkq8",
  authDomain: "quadro-de-horarios-cemal.firebaseapp.com",
  // Esta URL é padrão para novos projetos. Se der erro 404 no console, tente remover "-default-rtdb".
  databaseURL: "https://quadro-de-horarios-cemal-default-rtdb.firebaseio.com",
  projectId: "quadro-de-horarios-cemal",
  storageBucket: "quadro-de-horarios-cemal.firebasestorage.app",
  messagingSenderId: "938230155772",
  appId: "1:938230155772:web:233c1988be79c58ad7ca79",
  measurementId: "G-X4GRDELC5Q"
};

// Initialize Firebase
let app;
let db;

try {
    console.log("Tentando inicializar Firebase...");
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase inicializado com sucesso!");
} catch (error) {
    console.error("ERRO CRÍTICO AO INICIALIZAR FIREBASE:", error);
}

// --- SERVICES ---

// 1. SCHEDULE (Grade Horária)

export const subscribeToSchedule = (callback: (data: ScheduleItem[]) => void) => {
  if (!db) return () => {};
  
  try {
    const scheduleRef = ref(db, 'school_schedule');
    console.log("Conectando ao nó school_schedule...");
    return onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Dados recebidos do Firebase (Schedule):", data ? "Dados encontrados" : "Vazio");
      callback(data || []);
    }, (error) => {
      console.error("ERRO DE PERMISSÃO FIREBASE:", error);
      alert("Erro: O site não tem permissão para ler o banco de dados. Acesse o Console do Firebase > Realtime Database > Regras e altere para '.read': true, '.write': true");
    });
  } catch (e) {
    console.error("Erro na conexão com Firebase (Schedule):", e);
    return () => {};
  }
};

export const updateSchedule = async (newSchedule: ScheduleItem[]) => {
  if (!db) return;
  try {
    const scheduleRef = ref(db, 'school_schedule');
    return set(scheduleRef, newSchedule);
  } catch (e) {
    console.error("Erro ao salvar horário:", e);
    alert("Erro ao salvar. Verifique se as Regras do Firebase permitem escrita.");
  }
};

// 2. REGISTRY (Cadastros de Disciplinas/Professores)

export interface RegistryItem {
    subject: string;
    teachers: string[];
}

export const subscribeToRegistry = (callback: (data: RegistryItem[]) => void) => {
  if (!db) return () => {};

  try {
    const registryRef = ref(db, 'school_registry_linked');
    return onValue(registryRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || []);
    }, (error) => {
      console.error("Erro ao ler cadastros do Firebase:", error);
    });
  } catch (e) {
    console.error("Erro na conexão com Firebase (Registry):", e);
    return () => {};
  }
};

export const updateRegistry = async (newRegistry: RegistryItem[]) => {
  if (!db) return;
  try {
    const registryRef = ref(db, 'school_registry_linked');
    return set(registryRef, newRegistry);
  } catch (e) {
    console.error("Erro ao salvar cadastro:", e);
  }
};