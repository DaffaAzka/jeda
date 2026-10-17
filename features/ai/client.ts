import "server-only";

import { GoogleGenAI } from "@google/genai";

let genAiInstance: GoogleGenAI | null = null;

export function getGenAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY belum dikonfigurasi di environment. Tambahkan kunci API di .env.",
    );
  }

  if (!genAiInstance) {
    genAiInstance = new GoogleGenAI({ apiKey });
  }

  return genAiInstance;
}

export function getGeminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim();
  if (!model) {
    // Default model if GEMINI_MODEL not explicitly specified
    return "gemini-3.8-flash";
  }
  return model;
}
