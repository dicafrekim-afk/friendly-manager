
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly as per GenAI coding guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export const notificationService = {
  async generateAdminNotificationEmail(userName: string, userEmail: string): Promise<GeneratedEmail> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `신규 가입자 승인 요청 메일 작성. 수신: 관리자, 성함: ${userName}, 이메일: ${userEmail}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING }
            },
            required: ["subject", "body"]
          }
        }
      });

      // Use the .text property directly (not a method)
      const result = JSON.parse(response.text || '{}');
      return {
        subject: result.subject || `[Friendly] 신규 가입 승인 요청: ${userName}님`,
        body: result.body || `${userName}(${userEmail})님이 가입을 신청했습니다.`
      };
    } catch (error) {
      return {
        subject: `[Friendly] 신규 가입 승인 요청: ${userName}님`,
        body: `안녕하세요 관리자님, 신규 사용자 ${userName}(${userEmail})님이 가입을 신청하였습니다.`
      };
    }
  }
};