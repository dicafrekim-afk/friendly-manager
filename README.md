# Friendly Leave & Trip Manager 🚀

친절한 휴가 및 출장 관리 앱입니다. 이 앱은 클라우드 동기화를 위해 Supabase를 사용합니다.

### 🔑 Supabase 키 (VITE_SUPABASE_ANON_KEY) 찾는 방법

1.  **Supabase 대시보드** ([app.supabase.com](https://app.supabase.com))에 접속하여 프로젝트를 선택합니다.
2.  화면 왼쪽 맨 아래에 있는 **톱니바퀴 아이콘 (Settings)**을 클릭합니다.
3.  나타나는 사이드바 메뉴에서 **API** 항목을 클릭합니다.
4.  **Project API keys** 섹션을 찾으세요.
5.  **`anon` `public`** 이라고 적힌 행을 찾습니다.
    - 그 옆에 있는 `eyJhbG...`로 시작하는 **매우 긴 문자열**이 바로 `VITE_SUPABASE_ANON_KEY`입니다.
    - 우측의 **[Copy]** 버튼을 눌러 복사하세요.

### 🌐 Vercel 환경 변수 등록 시 주의사항

Vercel의 **Settings > Environment Variables** 메뉴에서 다음 세 가지를 등록해야 합니다:

| Key (이름) | Value (값) |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase API 설정의 **Project URL** (`https://...`) |
| `VITE_SUPABASE_ANON_KEY` | 위에서 복사한 **anon public** 키 |
| `API_KEY` | Gemini API 키 (VITE_ 접두사 없이 등록) |

---

### 🔄 중요: 환경 변수 등록 후 "재배포" 필수!
환경 변수만 저장한다고 앱에 바로 적용되지 않습니다. **반드시 아래 순서로 재배포 하세요.**

1. Vercel 프로젝트의 **Deployments** 탭 클릭
2. 리스트 맨 위(최신) 항목 우측의 **점 세개 [...]** 버튼 클릭
3. **Redeploy** 클릭
4. **"Use existing Build Cache" 체크박스를 반드시 해제** (중요!)
5. 다시 한번 **Redeploy** 버튼 클릭

---

### 💡 여전히 "Local Storage Mode"라고 뜨나요?
- Vercel 설정에서 변수 이름 앞에 `VITE_`가 정확히 붙었는지 확인하세요 (단, Gemini API용 `API_KEY`는 제외).
- `index.html`에 `importmap` 코드가 남아있는지 확인하세요 (이 코드는 삭제되어야 합니다).