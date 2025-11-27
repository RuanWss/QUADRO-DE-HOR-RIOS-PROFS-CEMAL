import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ScheduleItem } from "../types";

// Define the schema for the schedule array
const scheduleSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      dayOfWeek: { type: Type.INTEGER, description: "Day of the week (1=Monday to 5=Friday)" },
      startTime: { type: Type.STRING, description: "Start time in HH:mm format (24h)" },
      endTime: { type: Type.STRING, description: "End time in HH:mm format (24h)" },
      periodName: { type: Type.STRING, description: "Name of the period (e.g., '1º Horário')" },
      className: { type: Type.STRING, description: "Class identifier (e.g., '9º Ano A')" },
      subject: { type: Type.STRING, description: "School subject" },
      teacherName: { type: Type.STRING, description: "Name of the teacher" },
    },
    required: ["dayOfWeek", "startTime", "endTime", "periodName", "className", "subject", "teacherName"],
  },
};

export const generateSampleSchedule = async (): Promise<ScheduleItem[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Gere um cronograma escolar realista para uma escola de ensino médio, de segunda a sexta-feira. Crie 3 horários por dia começando as 07:30, com 50 minutos cada. Varie as matérias (Matemática, Português, História, Geografia, Ciências) e professores. Use nomes brasileiros.",
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);
    
    // Add IDs to the generated items
    const scheduleWithIds: ScheduleItem[] = rawData.map((item: any) => ({
      ...item,
      id: crypto.randomUUID(),
    }));

    return scheduleWithIds;
  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
};