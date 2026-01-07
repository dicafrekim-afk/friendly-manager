
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Notification } from '../types';
import { notificationService, GeneratedEmail } from '../services/notificationService';
import { dataService } from '../services/dataService';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailData, setEmailData] = useState<GeneratedEmail | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const users = await dataService.getUsers();

      if (users.some(u => u.email === email)) {
        alert('이미 등록된 이메일입니다.');
        setIsSubmitting(false);
        return;
      }

      const newUser: User = {
        id: `u-${Date.now()}`,
        email,
        name,
        role: 'USER',
        status: 'PENDING',
        totalLeave: 15,
        usedLeave: 0,
        joinDate: new Date().toISOString().split('T')[0]
      };

      // 1. 사용자 데이터 저장
      await dataService.register(newUser);

      // 2. 관리자 인앱 알림 생성
      const adminNotification: Notification = {
        id: `notif-${Date.now()}`,
        userId: 'ADMIN',
        title: '신규 가입 요청',
        message: `${name}(${email})님이 가입 승인을 요청했습니다.`,
        type: 'INFO',
        createdAt: new Date().toISOString(),
        isRead: false
      };
      await dataService.createNotification(adminNotification);

      // 3. Gemini를 이용한 이메일 본문 생성
      const content = await notificationService.generateAdminNotificationEmail(name, email);
      setEmailData(content);

      setSubmitted(true);
    } catch (error) {
      alert('가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMailClient = () => {
    if (!emailData) return;
    const adminEmail = 'dicafrekim@naver.com';
    const subject = encodeURIComponent(emailData.subject);
    const body = encodeURIComponent(emailData.body);
    window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-2xl shadow-xl border border-slate-100 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">가입 신청 완료</h2>
          <p className="text-slate-600 mb-6 text-sm">
            신청 내역이 관리자 대시보드에 등록되었습니다.<br/>
            더 빠른 승인을 위해 아래 버튼을 눌러 이메일을 발송할 수 있습니다.
          </p>

          {emailData && (
            <div className="mb-6">
              <button 
                onClick={openMailClient}
                className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 mb-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                관리자에게 메일 보내기
              </button>
              
              <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] text-slate-500 max-h-32 overflow-y-auto scrollbar-hide">
                <p className="font-bold text-slate-700 mb-1">작성된 메일 내용 미리보기:</p>
                <div className="whitespace-pre-wrap leading-relaxed italic">
                  <strong>제목:</strong> {emailData.subject}<br/><br/>
                  {emailData.body}
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            로그인 화면으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">회원가입</h1>
          <p className="text-slate-500 mt-2">새로운 여정을 Friendly와 함께하세요</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">이름</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">이메일 주소</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">비밀번호</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>가입 요청 생성 중...</span>
                </>
              ) : '가입 신청하기'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline">로그인</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
