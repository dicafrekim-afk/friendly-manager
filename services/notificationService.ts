
import { GoogleGenAI, Type } from "@google/genai";
import { LeaveRequest } from '../types';

export interface GeneratedEmail {
  subject: string;
  body: string;
}

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

const FROM_EMAIL = 'Friendly Manager <noreply@friendly-manager.com>';

const postToEmail = async (payload: object): Promise<void> => {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('이메일 발송 실패:', err);
  }
};

// 브라우저 → /api/slack-notify(서버) → Slack 웹훅 순서로 호출
// 로컬 dev: Vite 프록시가 /api/slack-notify를 Slack으로 포워딩
// Vercel 배포: /api/slack-notify 서버리스 함수가 처리
const postToSlack = async (payload: object): Promise<void> => {
  try {
    await fetch('/api/slack-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

  /**
   * 팀원이 휴가/출장을 신청했을 때 → 관리자(ADMIN/SuperAdmin)에게 메일 발송
   */
  async sendLeaveRequestEmailToAdmins(req: LeaveRequest, adminEmails: string[]): Promise<void> {
    if (!adminEmails.length) return;
    const typeLabel = getTypeLabel(req);
    const dateRange = getDateRange(req);

    await postToEmail({
      from: FROM_EMAIL,
      to: adminEmails,
      subject: `[Friendly] 새 ${typeLabel} 신청 — ${req.userName}님`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
          <h2 style="color:#4f46e5;margin:0 0 8px;">새 신청이 접수되었습니다</h2>
          <p style="color:#64748b;margin:0 0 24px;font-size:14px;">아래 내용을 확인하고 승인 여부를 결정해 주세요.</p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
            <tr><td style="padding:14px 18px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:30%;">신청자</td>
                <td style="padding:14px 18px;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9;">${req.userName} (${req.userTeam}팀)</td></tr>
            <tr><td style="padding:14px 18px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">유형</td>
                <td style="padding:14px 18px;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9;">${typeLabel}</td></tr>
            <tr><td style="padding:14px 18px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">기간</td>
                <td style="padding:14px 18px;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9;">${dateRange}</td></tr>
            <tr><td style="padding:14px 18px;color:#64748b;font-size:13px;">사유</td>
                <td style="padding:14px 18px;font-size:13px;font-weight:600;">${req.reason || '(없음)'}</td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">Friendly Leave &amp; Trip Manager</p>
        </div>
      `,
    });
  },

  /**
   * 관리자가 최종 승인했을 때 → 신청자에게 메일 발송
   */
  async sendApprovalEmailToUser(req: LeaveRequest, userEmail: string): Promise<void> {
    const typeLabel = getTypeLabel(req);
    const dateRange = getDateRange(req);

    await postToEmail({
      from: FROM_EMAIL,
      to: [userEmail],
      subject: `[Friendly] ${typeLabel} 신청이 승인되었습니다`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
          <h2 style="color:#4f46e5;margin:0 0 8px;">신청이 승인되었습니다 ✅</h2>
          <p style="color:#64748b;margin:0 0 24px;font-size:14px;">${req.userName}님의 신청이 최종 승인되었습니다.</p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
            <tr><td style="padding:14px 18px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:30%;">유형</td>
                <td style="padding:14px 18px;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9;">${typeLabel}</td></tr>
            <tr><td style="padding:14px 18px;color:#64748b;font-size:13px;">기간</td>
                <td style="padding:14px 18px;font-size:13px;font-weight:600;">${dateRange}</td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">Friendly Leave &amp; Trip Manager</p>
        </div>
      `,
    });
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
