
import { GoogleGenAI } from "@google/genai";

export const aiService = {
  async suggestLeaveReason(type: string, keywords: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `'${title}'라는 제목의 회의를 진행하려고 해. 효율적인 회의를 위해 논의해야 할 3~4가지 핵심 안건을 불렛 포인트로 작성해줘.`,
      });
      return response.text?.trim() || "안건을 직접 입력해주세요.";
    } catch (error) {
      console.error('AI agenda failed:', error);
      return "안건을 직접 입력해주세요.";
    }
  },

  async suggestSnackIdeas(count: number): Promise<string[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${count}명이서 사다리 타기를 할 거야. 꽝(간식 쏘기), 소액 결제, 커피, 디저트 등 재미있고 센스 있는 당첨 항목 리스트 ${count}개를 쉼표로 구분해서 작성해줘. (예: 아메리카노 쏘기, 탕후루 쏘기, 5천원 이내 간식 등)`,
      });
      const text = response.text?.trim() || "";
      return text.split(',').map(s => s.trim()).slice(0, count);
    } catch (error) {
      console.error('AI snack suggest failed:', error);
      return Array(count).fill("당첨");
    }
  }
};
