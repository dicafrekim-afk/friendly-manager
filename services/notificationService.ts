
import { GoogleGenAI, Type } from "@google/genai";
import { LeaveRequest } from '../types';

export interface GeneratedEmail {
  subject: string;
  body: string;
}

// .env.local (로컬) / Vercel 환경변수 → SLACK_WEBHOOK_URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

const LEAVE_TYPE_KO: Record<string, string> = {
  VACATION: '연차',
  HALF_DAY: '반차',
  BUSINESS_TRIP: '출장',
  SICK_LEAVE: '병가',
  OTHER: '기타',
  EXTRA_LEAVE: '보상휴가',
};

const HALF_DAY_KO: Record<string, string> = {
  MORNING: '오전반차',
  AFTERNOON: '오후반차',
};

const getTypeLabel = (req: LeaveRequest): string =>
  req.type === 'HALF_DAY' && req.halfDayType
    ? HALF_DAY_KO[req.halfDayType]
    : (LEAVE_TYPE_KO[req.type] ?? req.type);

const getDateRange = (req: LeaveRequest): string =>
  req.startDate === req.endDate ? req.startDate : `${req.startDate} ~ ${req.endDate}`;

const postToSlack = async (payload: object): Promise<void> => {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL이 설정되지 않았습니다.');
    return;
  }
  try {
    // 브라우저 CORS 우회: no-cors + form-encoded
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `payload=${encodeURIComponent(JSON.stringify(payload))}`,
    });
  } catch (err) {
    console.error('Slack 알림 전송 실패:', err);
  }
};

export const notificationService = {
  /**
   * POST /api/leave 상당 — 팀원이 휴가를 신청했을 때
   * 🔔 [이름]님이 [날짜]에 [유형]을 신청했습니다.
   */
  async sendSlackLeaveNotification(req: LeaveRequest): Promise<void> {
    const typeLabel = getTypeLabel(req);
    const dateRange = getDateRange(req);

    const payload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔔 *${req.userName}님이 ${dateRange}에 ${typeLabel}을(를) 신청했습니다.*`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*신청자*\n${req.userName} (${req.userTeam}팀)` },
            { type: 'mrkdwn', text: `*유형*\n${typeLabel}` },
            { type: 'mrkdwn', text: `*기간*\n${dateRange}` },
            { type: 'mrkdwn', text: `*사유*\n${req.reason || '(없음)'}` },
          ],
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `신청 시각: ${new Date().toLocaleString('ko-KR')}` },
          ],
        },
      ],
    };

    await postToSlack(payload);
  },

  /**
   * PATCH /api/leave/:id/approve 상당 — 관리자가 최종 승인했을 때
   * 🔔 [이름]님의 [유형] 신청이 승인되었습니다.
   */
  async sendSlackApprovalNotification(req: LeaveRequest): Promise<void> {
    const typeLabel = getTypeLabel(req);
    const dateRange = getDateRange(req);

    const payload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔔 *${req.userName}님의 ${typeLabel} 신청이 승인되었습니다.*`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*대상자*\n${req.userName} (${req.userTeam}팀)` },
            { type: 'mrkdwn', text: `*유형*\n${typeLabel}` },
            { type: 'mrkdwn', text: `*기간*\n${dateRange}` },
          ],
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `승인 시각: ${new Date().toLocaleString('ko-KR')}` },
          ],
        },
      ],
    };

    await postToSlack(payload);
  },

  async generateAdminNotificationEmail(userName: string, userEmail: string): Promise<GeneratedEmail> {
    const fallback = {
      subject: `[Friendly] 신규 가입 승인 요청: ${userName}님`,
      body: `안녕하세요 관리자님, 신규 사용자 ${userName}(${userEmail})님이 가입을 신청하였습니다.`
    };

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

      const result = JSON.parse(response.text || '{}');
      return {
        subject: result.subject || fallback.subject,
        body: result.body || fallback.body
      };
    } catch (error) {
      console.error('Email generation failed:', error);
      return fallback;
    }
  }
};
