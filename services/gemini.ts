
import { GoogleGenAI } from "@google/genai";
import { LogbookEntry, LogbookTemplate, AuditRecord } from "../types";

export const geminiService = {
  analyzeCompliance: async (auditLogs: AuditRecord[], entries: LogbookEntry[]) => {
    // Initializing Gemini API with the required parameter format
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
      Act as a Pharmaceutical Compliance Auditor. 
      Analyze the following system data for 21 CFR Part 11 and ALCOA+ compliance.
      
      Logbook Entries: ${JSON.stringify(entries.slice(0, 10))}
      Recent Audit Logs: ${JSON.stringify(auditLogs.slice(0, 10))}
      
      Provide a brief summary of:
      1. Overall compliance status.
      2. Any red flags (e.g., missing reasons for change, late entries).
      3. Suggestions for improvement.
      
      Format the output in clean Markdown.
    `;

    try {
      // Using gemini-3-pro-preview for complex reasoning/compliance auditing task
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "Unable to perform AI analysis at this time.";
    }
  },

  generateReportSummary: async (logbook: LogbookTemplate, data: LogbookEntry[]) => {
    // Initializing Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
      Summarize the data for the logbook "${logbook.name}".
      Number of entries: ${data.length}
      Data snippet: ${JSON.stringify(data.slice(0, 5))}
      
      Identify any trends or anomalies in the values.
      Keep it professional and concise.
    `;

    try {
      // Using gemini-3-flash-preview for basic summarization task
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      return "AI Summary unavailable.";
    }
  }
};
