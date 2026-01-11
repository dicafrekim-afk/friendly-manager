
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
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const users = await dataService.getUsers();
      // 이메일로 사용자 찾기 (대소문자 구분 없이 처리하려면 toLowerCase() 고려 가능)
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        // 비밀번호 엄격 검증: 저장된 비밀번호가 존재하고, 입력한 값과 정확히 일치해야 함
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
      setError('데이터를 불러오는 중 오류가 발생했습니다. 네트워크 상태를 확인하세요.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
                <a href="#" className="text-[10px] font-black text-indigo-600 hover:underline">비밀번호 찾기</a>
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
        
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Admin Demo Access</p>
          <p className="text-[10px] font-medium text-slate-400 mt-1">dicafrekim@naver.com / admin1234</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
