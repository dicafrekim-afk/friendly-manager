
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotName, setForgotName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'IDENTIFY' | 'RESET' | 'SUCCESS'>('IDENTIFY');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const users = await dataService.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        if (user.password && user.password === password) {
          onLogin(user);
          navigate('/');
        } else {
          setError('비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
        }
      } else {
        setError('등록되지 않은 이메일입니다. 이메일을 확인하거나 회원가입을 진행해 주세요.');
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const user = await dataService.findUserToReset(forgotEmail, forgotName);
    if (user) {
      setFoundUser(user);
      setResetStep('RESET');
    } else {
      setForgotError('일치하는 사용자 정보를 찾을 수 없습니다.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (foundUser && newPassword) {
      await dataService.updateUser(foundUser.id, { password: newPassword });
      setResetStep('SUCCESS');
      // Reset after 3 seconds or on close
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetStep('IDENTIFY');
    setForgotEmail('');
    setForgotName('');
    setNewPassword('');
    setFoundUser(null);
    setForgotError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Friendly</h1>
          <p className="text-slate-500 mt-2 font-medium">친절한 휴가 및 출장 관리 서비스</p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 animate-in shake duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일 주소</label>
              <input
                required
                disabled={isLoading}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">비밀번호</label>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black text-indigo-600 hover:underline">비밀번호 찾기</button>
              </div>
              <input
                required
                disabled={isLoading}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-md shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : null}
              {isLoading ? '인증 진행 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <p className="text-sm font-bold text-slate-400">
              계정이 아직 없으신가요?{' '}
              <Link to="/register" className="text-indigo-600 font-black hover:underline">회원가입 신청</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">비밀번호 찾기</h3>
                <button onClick={closeForgotModal} className="p-2 text-slate-400 hover:text-slate-900"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              {resetStep === 'IDENTIFY' && (
                <form onSubmit={handleIdentify} className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 mb-4 leading-relaxed">가입 시 등록한 이메일과 성함을 입력해 주세요.</p>
                  {forgotError && <p className="text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{forgotError}</p>}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일</label>
                    <input required type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold" placeholder="you@company.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">성함</label>
                    <input required type="text" value={forgotName} onChange={(e) => setForgotName(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold" placeholder="홍길동" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-2">확인</button>
                </form>
              )}

              {resetStep === 'RESET' && (
                <form onSubmit={handleResetPassword} className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A9 9 0 112.828 2.828L16 16.016l.135-.135" /></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{foundUser?.name}님 확인되었습니다!</p>
                  <p className="text-[10px] text-slate-400">새롭게 사용할 비밀번호를 입력해 주세요.</p>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">새 비밀번호</label>
                    <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold" placeholder="••••••••" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-2">비밀번호 변경하기</button>
                </form>
              )}

              {resetStep === 'SUCCESS' && (
                <div className="text-center py-6 animate-in zoom-in">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-2">변경 완료!</h4>
                  <p className="text-xs font-bold text-slate-400 mb-8">새로운 비밀번호로 로그인해 주세요.</p>
                  <button onClick={closeForgotModal} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm shadow-lg">로그인하러 가기</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
