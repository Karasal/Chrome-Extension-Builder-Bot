
import { GoogleGenAI, Type } from "@google/genai";
import { ExtensionProject } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateExtensionProject = async (idea: string): Promise<ExtensionProject | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a complete Chrome Extension project for this idea: "${idea}"`,
      config: {
        systemInstruction: "You are an expert Chrome Extension architect. Generate a valid, functional project including manifest.json (v3), popup/background scripts, and UI. Ensure the code is modern, secure, and follows Chrome Extension best practices. Output a structured JSON object.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extensionName: { type: Type.STRING, description: "Short, catchy name for the extension." },
            summary: { type: Type.STRING, description: "A 1-2 sentence description of what the generated extension does." },
            guideSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Step-by-step instructions for the user to set up this specific extension."
            },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "The filename (e.g., manifest.json, popup.js)." },
                  language: { type: Type.STRING, description: "The coding language." },
                  content: { type: Type.STRING, description: "The full source code for the file." },
                  description: { type: Type.STRING, description: "A brief note on what this file does in the context of the project." }
                },
                required: ["name", "language", "content", "description"]
              }
            }
          },
          required: ["extensionName", "summary", "guideSteps", "files"]
        }
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return JSON.parse(text) as ExtensionProject;
  } catch (error) {
    console.error("Gemini Project Generation Error:", error);
    return null;
  }
};

export const getExtensionAdvice = async (prompt: string, projectContext: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context of current project: ${projectContext}\n\nUser Question: ${prompt}`,
      config: {
        systemInstruction: "You are an expert Chrome Extension developer assistant. Use the provided project context to answer questions specifically about the extension currently being built. Be helpful, concise, and provide code snippets if necessary.",
      },
    });
    return response.text || "No response received from AI.";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "I encountered an error. Please try again.";
  }
};
