
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Notification } from '../types';
import { notificationService, GeneratedEmail } from '../services/notificationService';
import { dataService } from '../services/dataService';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
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
        password,
        name,
        phone,
        position: '팀원',
        team: '공통',
        role: 'USER',
        status: 'PENDING',
        totalLeave: 15,
        usedLeave: 0,
        joinDate: new Date().toISOString().split('T')[0]
      };

      await dataService.register(newUser);

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
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">신청 내역이 관리자 대시보드에 등록되었습니다.<br/>관리자 승인 후 로그인이 가능합니다.</p>
          <button onClick={() => navigate('/login')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">로그인 화면으로 이동</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">회원가입</h1>
          <p className="text-slate-500 mt-2 font-bold">새로운 여정을 Friendly와 함께하세요</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이름</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일 주소</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">전화번호</label>
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">비밀번호</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold transition-all" />
            </div>

            <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4">
              {isSubmitting ? '요청 중...' : '가입 신청하기'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm font-bold text-slate-400">이미 계정이 있으신가요? <Link to="/login" className="text-indigo-600 font-black hover:underline">로그인</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
