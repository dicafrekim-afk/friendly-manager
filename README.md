# Friendly Leave & Trip Manager 🚀

친절한 휴가 및 출장 관리 앱입니다. 이 앱은 클라우드 동기화를 위해 Supabase를 사용합니다.

### 🛠️ 데이터베이스 연동 및 환경변수 설정 가이드

모바일과 PC에서 데이터를 공유하려면 반드시 아래 3가지 환경변수를 Vercel에 등록해야 합니다.

#### 1. Supabase에서 값 찾기 (Settings > API 메뉴)
1. **VITE_SUPABASE_URL**: 
   - 'API' 설정 페이지 최상단 **"Project URL"** 섹션에 있는 `https://...` 주소입니다.
2. **VITE_SUPABASE_ANON_KEY**: 
   - **"API Keys"** 섹션의 `anon` `public` 항목 옆에 있는 아주 긴 문자열입니다.

#### 2. Vercel 환경 변수 등록 (상세 단계)
1. Vercel 프로젝트 페이지 접속 -> **[Settings]** 클릭 -> **[Environment Variables]** 클릭.
2. 아래 3개를 하나씩 추가합니다. **반드시 `VITE_` 접두사를 붙여야 앱이 인식합니다.**
   - `VITE_SUPABASE_URL`: (Supabase URL 복사 붙여넣기)
   - `VITE_SUPABASE_ANON_KEY`: (Supabase Anon Key 복사 붙여넣기)
   - `VITE_API_KEY`: (Gemini API 키)

---

### 🔄 중요: Vercel 재배포(Redeploy) 방법 (필수!)
**환경 변수를 수정/추가했다면 반드시 재배포를 해야 적용됩니다.**

1. Vercel 프로젝트 상단의 **[Deployments]** 메뉴로 들어갑니다.
2. 리스트 맨 위에 있는 최신 배포 항목 우측의 **[...] 버튼**을 클릭합니다.
3. **[Redeploy]**를 선택합니다.
4. 다시 한번 **[Redeploy]** 버튼을 눌러 빌드를 시작합니다.
5. `Ready` 상태가 되면 브라우저에서 앱을 새로고침하세요.

---

#### 3. SQL 테이블 생성 (데이터가 안 보일 때)
Supabase 대시보드의 **SQL Editor** 메뉴에서 아래 코드를 실행(Run)하세요.

```sql
-- 사용자 테이블
create table users (
  id text primary key,
  email text unique,
  name text,
  role text,
  status text,
  "totalLeave" int,
  "usedLeave" int,
  "joinDate" text
);

-- 휴가/출장 신청 테이블
create table leave_requests (
  id text primary key,
  "userId" text references users(id),
  "userName" text,
  type text,
  "startDate" text,
  "endDate" text,
  reason text,
  status text,
  "createdAt" text
);

-- 회의 예약 테이블
create table meetings (
  id text primary key,
  title text,
  description text,
  "startTime" text,
  "endTime" text,
  "organizerId" text references users(id),
  participants text[]
);
```

### 💡 문제 해결 (Troubleshooting)
- **노란색 경고창이 계속 뜨나요?**: Vercel Settings에서 변수 이름 앞에 `VITE_`가 빠졌는지 확인하고, 반드시 **Redeploy**를 했는지 다시 확인하세요.
- **로그인이 안 되나요?**: SQL Editor에서 테이블 생성을 완료했는지 확인하세요.
- **AI 기능이 안 되나요?**: `VITE_API_KEY`가 올바른지 확인하세요.
