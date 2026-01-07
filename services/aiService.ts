
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  return (import.meta as any).env?.VITE_API_KEY || 
         (import.meta as any).env?.API_KEY ||
         (process.env as any).VITE_API_KEY || 
         process.env.API_KEY || 
         "";
};

export const aiService = {
  async suggestLeaveReason(type: string, keywords: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) return keywords;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `유형: ${type}, 키워드: ${keywords}. 이 내용을 바탕으로 회사에 제출할 격식 있는 휴가/출장 사유를 한 문장으로 작성해줘.`,
      });
      return response.text?.trim() || keywords;
    } catch (error) {
      console.error('AI suggest failed:', error);
      return keywords;
    }
  },

  async suggestMeetingAgenda(title: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) return "안건을 직접 입력해주세요.";

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `'${title}'라는 제목의 회의를 진행하려고 해. 효율적인 회의를 위해 논의해야 할 3~4가지 핵심 안건을 불렛 포인트로 작성해줘.`,
      });
      return response.text?.trim() || "안건을 직접 입력해주세요.";
    } catch (error) {
      console.error('AI agenda failed:', error);
      return "안건을 직접 입력해주세요.";
    }
  }
};
