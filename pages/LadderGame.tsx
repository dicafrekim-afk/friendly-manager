
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';

interface Line {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const LadderGame: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'RESULT'>('SETUP');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [ladderData, setLadderData] = useState<{ bridges: Line[], verticalLines: number } | null>(null);
  const [activePaths, setActivePaths] = useState<number[]>([]); // 애니메이션 중인 경로 index

  const canvasRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await dataService.getUsers();
      setAllUsers(data.filter(u => u.status === 'APPROVED'));
    };
    fetchUsers();
  }, []);

  const handleAiRecommend = async () => {
    if (participants.length < 2) {
      alert('먼저 참여자를 2명 이상 선택해주세요.');
      return;
    }
    setIsAiLoading(true);
    const suggested = await aiService.suggestSnackIdeas(participants.length);
    setResults(suggested);
    setIsAiLoading(false);
  };

  const toggleParticipant = (name: string) => {
    if (participants.includes(name)) {
      const idx = participants.indexOf(name);
      setParticipants(participants.filter(p => p !== name));
      setResults(results.filter((_, i) => i !== idx));
    } else {
      setParticipants([...participants, name]);
      setResults([...results, "당첨"]);
    }
  };

  const startLadder = () => {
    if (participants.length < 2) {
      alert('최소 2명 이상의 참여자가 필요합니다.');
      return;
    }
    if (results.some(r => !r.trim())) {
      alert('모든 당첨 항목을 입력해주세요.');
      return;
    }

    // 사다리 데이터 생성
    const verticalLines = participants.length;
    const bridges: Line[] = [];
    const bridgeCount = verticalLines * 4; // 가로줄 개수

    for (let i = 0; i < bridgeCount; i++) {
      const startLineIdx = Math.floor(Math.random() * (verticalLines - 1));
      const height = Math.floor(Math.random() * 80) + 10; // 10% ~ 90% 높이 사이

      // 인접한 줄 사이에 이미 비슷한 높이에 줄이 있는지 확인 (겹침 방지)
      const isOverlap = bridges.some(b => 
        (b.fromX === startLineIdx || b.fromX === startLineIdx + 1 || b.toX === startLineIdx) && 
        Math.abs(b.fromY - height) < 5
      );

      if (!isOverlap) {
        bridges.push({
          fromX: startLineIdx,
          fromY: height,
          toX: startLineIdx + 1,
          toY: height
        });
      }
    }

    setLadderData({ bridges, verticalLines });
    setGameState('PLAYING');
    setActivePaths([]);
  };

  const getPath = (startIdx: number): string => {
    if (!ladderData) return "";
    
    let currentX = startIdx;
    let currentY = 0;
    const pathPoints = [[startIdx, 0]];
    const sortedBridges = [...ladderData.bridges].sort((a, b) => a.fromY - b.fromY);

    while (currentY < 100) {
      // 현재 줄에서 만나는 다음 가로줄 찾기
      const nextBridge = sortedBridges.find(b => 
        b.fromY > currentY && (b.fromX === currentX || b.toX === currentX)
      );

      if (nextBridge) {
        pathPoints.push([currentX, nextBridge.fromY]);
        currentX = nextBridge.fromX === currentX ? nextBridge.toX : nextBridge.fromX;
        pathPoints.push([currentX, nextBridge.fromY]);
        currentY = nextBridge.fromY;
      } else {
        pathPoints.push([currentX, 100]);
        currentY = 100;
      }
    }

    // SVG viewBox(0 0 100 100) 좌표계에 맞게 변환 (단위 % 제거)
    const spacing = 100 / (ladderData.verticalLines + 1);
    return pathPoints.map(p => `${(p[0] + 1) * spacing},${p[1]}`).join(" ");
  };

  const handleUserClick = (idx: number) => {
    if (activePaths.includes(idx)) return;
    setActivePaths([...activePaths, idx]);
  };

  const resetGame = () => {
    setGameState('SETUP');
    setLadderData(null);
    setActivePaths([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">사다리 타기</h1>
          <p className="text-sm font-bold text-slate-400 mt-2 italic">팀원들과 소소한 즐거움을 나누어보세요.</p>
        </div>
        {gameState !== 'SETUP' && (
          <button onClick={resetGame} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">다시 하기</button>
        )}
      </div>

      {gameState === 'SETUP' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 참여자 선택 */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">1</span>
              참여자 선택 ({participants.length}명)
            </h2>
            <div className="flex flex-wrap gap-2">
              {allUsers.map(user => (
                <button 
                  key={user.id} 
                  onClick={() => toggleParticipant(user.name)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${
                    participants.includes(user.name) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
                  }`}
                >
                  {user.name}
                </button>
              ))}
            </div>
            <div className="pt-4">
              <p className="text-[10px] font-bold text-slate-300">팁: 팀원 이름을 클릭하여 추가/제외할 수 있습니다.</p>
            </div>
          </div>

          {/* 결과 설정 */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">2</span>
                당첨 항목 설정
              </h2>
              <button 
                onClick={handleAiRecommend}
                disabled={isAiLoading || participants.length < 2}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100 hover:bg-indigo-100 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isAiLoading ? '...' : '✨ AI 간식 추천'}
              </button>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide pr-2">
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <span className="w-12 text-[10px] font-black text-slate-300 truncate">{p}</span>
                  <input 
                    type="text" 
                    value={results[i] || ""} 
                    onChange={(e) => {
                      const newResults = [...results];
                      newResults[i] = e.target.value;
                      setResults(newResults);
                    }}
                    placeholder="결과 입력"
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none text-xs font-bold transition-all"
                  />
                </div>
              ))}
              {participants.length === 0 && (
                <div className="py-20 text-center text-slate-300 text-xs italic">참여자를 먼저 선택해주세요.</div>
              )}
            </div>

            <button 
              onClick={startLadder}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              사다리 만들기
            </button>
          </div>
        </div>
      ) : (
        /* 사다리 게임 화면 */
        <div className="bg-white p-8 md:p-16 rounded-[48px] shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="relative min-h-[500px] w-full flex flex-col">
            {/* 참여자 이름 (상단) */}
            <div className="flex justify-around mb-10">
              {participants.map((p, i) => {
                const spacing = 100 / (participants.length + 1);
                return (
                  <div 
                    key={i} 
                    onClick={() => handleUserClick(i)}
                    className={`absolute text-center cursor-pointer transition-all hover:scale-110`}
                    style={{ left: `${(i + 1) * spacing}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xs md:text-sm font-black shadow-lg transition-all ${activePaths.includes(i) ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-white border border-slate-200'}`}>
                      {p.charAt(0)}
                    </div>
                    <p className="mt-3 text-[10px] font-black text-slate-400">{p}</p>
                  </div>
                );
              })}
            </div>

            {/* 사다리 메인 보드 (viewBox 적용) */}
            <div className="flex-1 relative mt-16 mb-20">
              <svg className="w-full h-full min-h-[400px]" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* 세로줄 (숫자 좌표 사용) */}
                {Array.from({ length: ladderData?.verticalLines || 0 }).map((_, i) => {
                  const spacing = 100 / ((ladderData?.verticalLines || 0) + 1);
                  return (
                    <line 
                      key={`v-${i}`} 
                      x1={(i + 1) * spacing} y1="0" 
                      x2={(i + 1) * spacing} y2="100" 
                      stroke="#F1F5F9" strokeWidth="1" strokeLinecap="round" 
                    />
                  );
                })}

                {/* 가로줄 (브릿지) (숫자 좌표 사용) */}
                {ladderData?.bridges.map((b, i) => {
                  const spacing = 100 / (ladderData.verticalLines + 1);
                  return (
                    <line 
                      key={`b-${i}`} 
                      x1={(b.fromX + 1) * spacing} y1={b.fromY} 
                      x2={(b.toX + 1) * spacing} y2={b.toY} 
                      stroke="#F1F5F9" strokeWidth="1" strokeLinecap="round" 
                    />
                  );
                })}

                {/* 활성화된 경로 애니메이션 (단위 제거) */}
                {activePaths.map((startIdx) => (
                  <polyline 
                    key={`path-${startIdx}`}
                    points={getPath(startIdx)}
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="path-animation"
                    style={{
                      strokeDasharray: 2000,
                      strokeDashoffset: 2000,
                      animation: 'draw 2s forwards ease-in-out'
                    }}
                  />
                ))}
              </svg>
            </div>

            {/* 결과 항목 (하단) */}
            <div className="flex justify-around mt-4">
              {results.map((r, i) => {
                const spacing = 100 / (participants.length + 1);
                return (
                  <div 
                    key={i} 
                    className="absolute text-center"
                    style={{ left: `${(i + 1) * spacing}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl min-w-[80px]">
                      <p className="text-[11px] font-black text-slate-700 truncate">{r}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <style>{`
            @keyframes draw {
              to {
                stroke-dashoffset: 0;
              }
            }
            .path-animation {
              filter: drop-shadow(0 0.5px 1px rgba(79, 70, 229, 0.2));
            }
          `}</style>

          <div className="mt-20 text-center">
            <p className="text-sm font-bold text-slate-400">팀원 이름을 클릭하면 사다리를 타고 내려갑니다!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LadderGame;
