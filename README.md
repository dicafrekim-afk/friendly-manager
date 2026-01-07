# Friendly Leave & Trip Manager 🚀

친절한 휴가 및 출장 관리 앱입니다. 이 앱은 클라우드 동기화를 위해 Supabase를 사용합니다.

### 🛠️ 데이터베이스 연동 및 환경변수 설정 가이드

모바일과 PC에서 데이터를 공유하려면 반드시 아래 3가지 환경변수를 Vercel에 등록해야 합니다.

#### 1. Supabase에서 값 찾기 (Settings > API 메뉴)
1. **VITE_SUPABASE_URL**: 
   - 'API' 설정 페이지 최상단 **"Project URL"** 섹션에 있는 `https://...` 주소입니다.
2. **VITE_SUPABASE_ANON_KEY**: 
   - **"API Keys"** 섹션의 `anon` `public` 항목 옆에 있는 아주 긴 문자열입니다. (스크린샷에서 복사 버튼이 있는 값)

#### 2. Vercel 환경 변수 등록 (중요!)
Vercel 프로젝트 설정의 **Environment Variables**에 아래 이름으로 등록하세요. 
**반드시 앞글자에 `VITE_`가 포함되어야 합니다.**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_KEY` (Gemini API 키)

#### 3. SQL 테이블 생성
Supabase 대시보드의 **SQL Editor** 메뉴에서 아래 코드를 복사해서 실행(Run)하세요. 이 작업을 하지 않으면 로그인이 되지 않습니다.

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

### 💡 팁
- 설정을 마친 후 Vercel에서 **Redeploy**를 해야 변경된 환경변수가 적용됩니다.
- 로그인 시 "등록되지 않은 이메일입니다"가 뜬다면 SQL Editor에서 테이블이 정상적으로 생성되었는지 확인하세요.
