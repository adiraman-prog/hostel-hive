import { GoogleGenAI } from "@google/genai";
import { AppData } from '../types';

// Fix: Updated API key initialization to align with best practices.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReport = async (data: AppData, query: string): Promise<AsyncGenerator<string>> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    You are an expert hostel management analyst. Based on the following data for a hostel business, provide a concise and clear answer to the user's query.

    Data (in JSON format):
    ${JSON.stringify(data, null, 2)}

    User Query:
    "${query}"

    Your response should be formatted in clean markdown.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: prompt,
    });
    
    const stream = (async function*() {
      for await (const chunk of responseStream) {
        yield chunk.text;
      }
    })();

    return stream;

  } catch (error) {
    console.error("Error generating report with Gemini API:", error);
    throw new Error("Failed to get response from AI. Check API key and network.");
  }
};
