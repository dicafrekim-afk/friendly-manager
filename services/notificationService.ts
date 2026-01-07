
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export const notificationService = {
  /**
   * Gemini를 사용하여 신규 가입 알림 메일 정보를 생성합니다.
   */
  async generateAdminNotificationEmail(userName: string, userEmail: string): Promise<GeneratedEmail> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          다음 신규 가입자에 대한 관리자 승인 요청 이메일을 작성해줘.
          수신자: 관리자 (dicafrekim@naver.com)
          가입자 이름: ${userName}
          가입자 이메일: ${userEmail}
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING, description: "이메일 제목" },
              body: { type: Type.STRING, description: "이메일 본문 (격식 있는 비즈니스 어투)" }
            },
            required: ["subject", "body"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        subject: result.subject || `[Friendly] 신규 가입 승인 요청: ${userName}님`,
        body: result.body || `${userName}(${userEmail})님이 가입을 신청했습니다.`
      };
    } catch (error) {
      console.error('Email generation failed:', error);
      return {
        subject: `[Friendly] 신규 가입 승인 요청: ${userName}님`,
        body: `안녕하세요 관리자님,\n\n신규 사용자 ${userName}(${userEmail})님이 가입을 신청하였습니다.\n관리자 페이지에서 승인을 진행해 주시기 바랍니다.\n\n감사합니다.`
      };
    }
  }
};
