# Friendly Leave & Trip Manager 🚀

친절한 휴가 및 출장 관리 앱입니다. 이 앱은 클라우드 동기화를 위해 Supabase를 사용하며 AI 기능을 위해 Gemini를 사용합니다.

### 🔑 환경 변수 설정 (Vercel)

Vercel의 **Settings > Environment Variables** 메뉴에서 다음 세 가지를 반드시 등록해야 합니다:

| Key (이름) | Value (값) | 설명 |
| :--- | :--- | :--- |
| `API_KEY` | Gemini API Key | `VITE_` 접두사 없이 등록하세요. |
| `VITE_SUPABASE_URL` | Supabase Project URL | Supabase API 설정에서 확인 가능합니다. |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key | Supabase API 설정의 `anon` `public` 키입니다. |

---

### 🔄 중요: 재배포 가이드

환경 변수를 수정한 후에는 반드시 **기존 캐시를 무시하고 재배포**해야 합니다.

1. Vercel 프로젝트 대시보드의 **Deployments** 탭으로 이동합니다.
2. 최신 배포 항목 우측의 **점 세개 [...]** 버튼을 클릭합니다.
3. **Redeploy**를 클릭합니다.
4. 나타나는 팝업에서 **"Use existing Build Cache" 체크박스를 반드시 해제**하세요.
5. 다시 한번 **Redeploy** 버튼을 누르면 새로운 환경 변수가 반영된 빌드가 시작됩니다.

---

### 💡 확인 방법
배포 완료 후 사이트에 접속하여 브라우저 개발자 도구(F12)의 **Console** 탭을 확인하세요.
- `✅ Cloud DB Connected` 메시지가 보이면 정상입니다.
- `⚠️ Local Storage Mode`가 보인다면 환경 변수 이름(VITE_ 접두사 등)을 다시 확인해 주세요.