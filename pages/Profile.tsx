
import React, { useState, useRef, useEffect } from 'react';
import { User, Team } from '../types';
import { dataService } from '../services/dataService';

const TEAMS: Team[] = ['공채', '경채', '특정직', '공통'];

const Profile: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [team, setTeam] = useState<Team>('공통');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = localStorage.getItem('friendly_current_session');
    if (session) {
      const user: User = JSON.parse(session);
      setCurrentUser(user);
      setName(user.name);
      setPosition(user.position || '');
      setPhone(user.phone || '');
      setTeam(user.team || '공통');
      setProfileImage(user.profileImage);
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('이미지 크기는 2MB를 초과할 수 없습니다.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSaving(true);
    try {
      const updates: Partial<User> = {
        name,
        position,
        phone,
        team,
        profileImage
      };
      
      await dataService.updateUser(currentUser.id, updates);
      alert('개인 정보가 성공적으로 수정되었습니다.');
      
      // 세션 갱신을 위해 로컬 스토리지 데이터 동기화
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('friendly_current_session', JSON.stringify(updatedUser));
      
      // 앱 전체의 Header 등에서 인식할 수 있게 이벤트 발생
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      alert('정보 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">개인 정보 수정</h1>
        <p className="text-sm font-bold text-slate-400 mt-2">나의 프로필과 연락처를 관리하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[40px] bg-slate-100 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl font-black text-slate-300">{name.charAt(0)}</div>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">사진을 클릭하여 변경하세요 (Max 2MB)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이름</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-black transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">직급</label>
            <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 대리" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-black transition-all" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">전화번호</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-black transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">소속 팀</label>
            <select 
              value={team}
              onChange={(e) => setTeam(e.target.value as Team)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-black appearance-none transition-all cursor-pointer"
            >
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:bg-slate-300"
          >
            {isSaving ? '저장 중...' : '변경 사항 저장'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
