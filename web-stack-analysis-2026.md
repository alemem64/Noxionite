# 웹 개발 스택 분석 (2026년 7월 기준)

> Next.js + Vercel 조합에서 시작해, 현재 시점의 프레임워크 / 호스팅 / DB / Docker 선택지를 정리한 문서.
> 작성 배경: Vercel 무료 티어에서 봇 트래픽으로 사용량 300% 초과 → 사이트 중단 경험.

---

## 1. 요약 (TL;DR)

- **Next.js + Vercel은 여전히 "가장 쉬운" 조합이지만, 더 이상 "기본값"은 아니다.** 특히 무료로 여러 프로젝트를 굴리는 사람에게는 2024~2026년 사이에 대안이 훨씬 좋아졌다.
- 겪은 문제(봇 크롤링 → 사용량 폭발)는 Vercel의 과금 구조(함수 호출 수 + 대역폭 + 이미지 최적화 단위 과금) 때문에 생기는 전형적인 사례다. **프레임워크 문제가 아니라 호스팅 과금 모델 문제**다.
- 현재 가성비 기준 현실적인 3가지 노선:
  1. **Cloudflare (Workers/Pages)** — 무료 티어가 압도적. 정적 자산 대역폭 무제한, 봇이 아무리 긁어도 정적 파일은 과금 없음.
  2. **저가 VPS(Hetzner 등) + Coolify/Dokploy** — 월 €4~10으로 프로젝트 수십 개. Docker 기반, git push 배포, 프리뷰 URL까지 Vercel 경험을 거의 재현. Vercel $600/월 규모 워크로드가 셀프호스팅 시 $40~60/월 수준이라는 비교가 흔함.
  3. **Railway / Render / Fly.io** — VPS 관리는 싫고 Vercel보다 예측 가능한 과금을 원할 때의 중간 지점.
- **복잡한 시스템(DB, 백그라운드 작업, 실시간 기능 포함)**을 만들기 시작했다면, "프론트 프레임워크 + 서버리스"보다 **Docker로 묶은 풀스택 앱 + VPS/PaaS**가 관리도 비용도 단순해지는 시점이 온다.

---

## 2. 왜 Vercel에서 터졌는가 — 문제 진단

Vercel 무료(Hobby) 티어의 한도는 대략:

| 항목 | 무료 한도 | 봇 크롤링 시 영향 |
|---|---|---|
| 대역폭 | 100 GB/월 | 페이지/이미지 반복 요청으로 소진 |
| 함수 호출 | 제한 있음 | SSR/ISR 페이지는 요청마다 함수 실행 |
| 이미지 최적화 | 소스 이미지 수 기준 과금 | `next/image`는 봇 요청에도 변환 실행 |
| Edge 요청 | 제한 있음 | 크롤러가 그대로 카운트 |

핵심: **SSR/ISR 페이지는 "요청 = 서버 실행 = 과금"**이다. AI 크롤러(GPTBot, ClaudeBot, Bytespider 등)가 2024년 이후 폭증하면서, 콘텐츠 사이트(noxionite 같은 Notion 기반 블로그)는 실사용자보다 봇 트래픽이 몇 배 많은 게 보통이 됐다. Vercel은 이 트래픽을 전부 과금 대상으로 잡는다.

### 당장 쓸 수 있는 완화책 (호스팅을 안 바꿔도)
1. **Cloudflare를 앞단에 무료로 두기** (DNS 프록시 모드) → Bot Fight Mode, AI 크롤러 차단, 캐싱으로 Vercel 도달 트래픽 자체를 줄임.
2. `robots.txt`에서 불필요한 크롤러 차단 + Vercel의 Bot Protection/WAF 규칙 활용.
3. SSR 페이지를 최대한 **정적 생성(SSG)** 으로 전환 → 함수 호출 과금 제거.
4. `next/image` 대신 빌드 타임 이미지 처리 또는 `unoptimized` + 외부 CDN.

---

## 3. 호스팅/배포 계층 — 2026년 선택지

### 3-1. Vercel (현상 유지)
- **장점**: DX 최고. git push → 배포, 프리뷰 URL, Next.js와의 통합(ISR, PPR 등)은 사실상 독점적. 팀 협업 기능 우수.
- **단점**: 과금 단위가 많고 예측이 어려움(함수 호출, 대역폭, 이미지, Edge 요청 각각 과금). 봇 트래픽에 취약. Pro는 $20/월/인. 트래픽이 늘면 요금이 비선형적으로 뜀.
- **적합**: 회사 돈으로 쓰거나, 트래픽 적은 프로토타입.

### 3-2. Cloudflare Workers / Pages ⭐ (콘텐츠 사이트에 최적)
- **장점**: **정적 자산 대역폭 무제한 무료** — 봇 문제의 근본 해결. Workers 유료도 $5/월에 1,000만 요청. 2026년 1월 Astro 인수 후 프론트 생태계 투자 활발. OpenNext 어댑터로 Next.js 배포 가능.
- **단점**: 런타임이 Node.js가 아니라 V8 isolate → 일부 Node API/패키지 안 됨. Next.js의 모든 기능이 완벽 지원되지는 않음(Astro/SvelteKit/Remix가 더 잘 맞음). 디버깅 경험이 Vercel보다 거침.
- **적합**: 블로그, 랜딩, 문서 사이트, 가벼운 API. **noxionite류 사이트는 여기가 정답에 가까움.**

### 3-3. VPS + Coolify / Dokploy ⭐ (여러 프로젝트 + 복잡한 시스템)
- **구성**: Hetzner CX22(€3.79/월, 2vCPU 4GB) ~ CX32(€9.38/월, 4vCPU 8GB) 한 대에 Coolify나 Dokploy 설치.
- **장점**:
  - 프로젝트 개수 무제한 — 사이트 10개든 20개든 서버 한 대 값.
  - git push 배포, 자동 SSL, PR 프리뷰, **원클릭 DB(Postgres/Redis/MySQL)** — Vercel 경험의 80~90% 재현.
  - Docker 기반이라 언어/프레임워크 불문. 백그라운드 워커, cron, websocket 전부 자유.
  - 봇이 긁어도 요금 고정. 최악의 경우 느려질 뿐 **청구서 폭탄이나 중단이 없음.**
- **단점**: 서버 관리 책임(업데이트, 백업, 보안)이 본인에게. 초기 세팅 반나절. 글로벌 엣지 아님(서버 위치 1곳). 스케일링 수동.
- **적합**: 게임/앱/웹 경험 있는 개발자가 여러 프로젝트를 싸게 돌리고 싶을 때. **현재 상황에 가장 추천하는 노선.**

### 3-4. Railway / Render / Fly.io (관리형 중간 지점)
| | Railway | Render | Fly.io |
|---|---|---|---|
| 성격 | 사용량 기반, DX 최고 | Heroku 후계자, 안정적 | 글로벌 엣지 + Docker 완전 제어 |
| 비용 | $5/월부터 사용량 과금 | 웹 서비스 $7/월~ | 사용량 기반 |
| 장점 | DB 포함 원클릭, 직관적 | 관리형 Postgres, cron 등 완비 | 여러 리전 배포 |
| 단점 | 규모 커지면 비쌈($40~50/월 넘으면 VPS가 이득) | 무료 티어 콜드스타트 | 러닝커브, 문서 대비 실동작 차이 |
- **적합**: 서버 관리는 싫지만 Vercel 과금 모델은 피하고 싶을 때. 솔로 개발자 첫 배포처로는 Railway 평이 가장 좋음.

---

## 4. 프레임워크 계층 — 2026년 지형도

### 4-1. JS/TS 메타프레임워크

| 프레임워크 | 장점 | 단점 | 이럴 때 |
|---|---|---|---|
| **Next.js 15+** | 최대 생태계, 채용/자료 풍부, React 그대로, Turbopack 안정화, PPR | 복잡도 급증(App Router, RSC, 캐싱 규칙), Vercel 밖 배포는 2등 시민, 번들 무거움 | React 투자 이미 큼, 팀 확장 예정, 복잡한 앱 |
| **Astro 5** | 콘텐츠 사이트 성능 압도적(기본 JS 0), LCP가 Next 대비 40~70% 우수, React/Svelte/Vue 컴포넌트 혼용 가능, Cloudflare 인수로 지원 강화 | 고도로 인터랙티브한 앱에는 부적합 | **블로그, 랜딩, 마케팅, 문서 — noxionite 재작성 시 1순위 후보** |
| **SvelteKit (Svelte 5)** | 개발자 만족도 1위권, 코드량 적음, 번들 ~50% 작음, 기본 Lighthouse 90+ | 생태계/채용 풀이 React 대비 작음, 대형 서드파티 컴포넌트 부족 | 혼자/소규모로 앱 만들 때 DX+성능 둘 다 원하면 |
| **React Router v7 (구 Remix)** | 웹 표준 중심, 서버 우선 설계, 캐싱 마법 없음(예측 가능), 셀프호스팅 친화적 | Remix→RR7 전환기 혼란, Next 대비 생태계 작음 | React는 쓰되 Vercel 종속 없이 SSR 하고 싶을 때 |
| **Nuxt 4** | Vue 진영 표준, Nitro 서버 엔진이 배포처 중립적 | Vue 자체 점유율 하락세 | Vue를 이미 좋아하면 |

시장 점유율은 여전히 React가 40~45%로 압도적(주간 다운로드 3천만+, 2위의 3배)이라 **"React를 버려라"는 아니고, "Next.js가 유일한 답은 아니다"**가 정확한 현재 상태.

### 4-2. 백엔드 중심 풀스택 (복잡한 시스템용)

"웹으로 복잡한 시스템"이라면 JS 메타프레임워크보다 이쪽이 더 맞을 수 있다. 2024~2026년에 "서버 렌더링 + 약간의 JS(HTMX 등)" 회귀 트렌드도 뚜렷하다.

| 스택 | 장점 | 단점 | 이럴 때 |
|---|---|---|---|
| **Laravel (PHP)** | 풀스택 배터리 포함(인증, 큐, 결제, 관리자), Livewire/Inertia로 SPA 느낌, 배포 저렴, 문서·생태계 성숙 | PHP 선입견, 국내 채용 풀 | 혼자서 SaaS를 빨리, 싸게 |
| **Rails (Ruby)** | 생산성 전설적, Hotwire로 JS 최소화, 37signals의 셀프호스팅 도구(Kamal) 정비 | Ruby 성능, 국내 비주류 | 위와 동일 (취향 차이) |
| **Django (Python)** | 관리자 페이지 내장, Python 생태계(AI/데이터 연동), 안정성 | 프론트 인터랙션은 별도 해결 필요 | 데이터/AI 무거운 시스템 |
| **Go (Echo/Chi + templ/HTMX)** | 단일 바이너리 배포, 저사양 VPS에서 성능 최고, 동시성 | UI 생산성 낮음, 코드량 많음 | API 서버, 인프라성 도구 |
| **Elixir/Phoenix (LiveView)** | 실시간 기능(채팅, 대시보드)이 공짜에 가까움, 안정성 | 언어 러닝커브, 작은 생태계 | 실시간 협업/게임성 있는 웹 |
| **Spring Boot (Java/Kotlin)** | 국내 기업 표준, 채용 최강 | 개인 프로젝트엔 무거움 | 취업/이직 겸용 목적 |

### 4-3. 프론트+백 조합의 현실적 패턴 (2026)
1. **올인원 JS**: Next.js/SvelteKit이 프론트+API 다 담당. 간단할 땐 좋지만 복잡해지면 서버리스 제약(장시간 작업, websocket, cron)에 부딪힘.
2. **분리형**: 프론트(Astro/Next 정적) + 백엔드(Go/Python/Node API 서버) + Docker. 복잡한 시스템의 정석. 확장 자유.
3. **풀스택 모놀리스**: Laravel/Rails/Django 하나 + HTMX/Livewire. 1인 개발 생산성 최고, 배포 단위 1개.

---

## 5. 데이터베이스 계층

### 관리형(서버리스) Postgres
| 서비스 | 무료 티어 | 유료 | 특징 |
|---|---|---|---|
| **Supabase** | 프로젝트 2개 (1주 미사용 시 일시정지) | $25/월 | DB + 인증 + 스토리지 + 실시간 + Edge Functions 올인원. 번들로 보면 대개 최저가 |
| **Neon** | 100 컴퓨트시간/월, 만료 없음 | ~$19/월~ | 순수 Postgres, scale-to-zero(안 쓰면 과금 0), 브랜칭. 콜드스타트 ~500ms |
| **PlanetScale** | 없음 (무료 티어 폐지) | $5/월~ | MySQL(Vitess) + 최근 Postgres 지원. 대규모 지향 |
| **Turso (SQLite)** | 넉넉함 | 저렴 | 엣지 복제 SQLite. 읽기 위주 소규모에 강력 |

### 셀프호스팅 (VPS 노선과 결합)
- Coolify/Dokploy에서 **Postgres 원클릭 설치** → 추가 비용 0. 백업만 S3 호환 스토리지(Cloudflare R2 무료 10GB)로 걸어두면 개인/소규모엔 충분.
- 복잡한 시스템에서 Redis(큐/캐시)까지 같은 서버에 띄우는 게 일반적.

### 판단 기준
- **인증/스토리지까지 필요** → Supabase (따로 조립하는 것보다 싸고 빠름)
- **DB만, 간헐적 사용** → Neon (안 쓰면 0원)
- **VPS 이미 운영 중** → 그냥 같은 서버에 Postgres (비용 0, 지연시간 최소)

---

## 6. Docker는 어디에 들어가는가

- **Vercel/Netlify/Cloudflare 노선**: Docker 불필요. 플랫폼이 빌드/런타임을 추상화.
- **VPS(Coolify/Dokploy), Railway, Fly.io 노선**: Docker(또는 Nixpacks 자동 빌드)가 배포 단위. `Dockerfile` 하나 = 어디서든 동일하게 실행.
- **Docker를 쓰면 얻는 것**:
  - 프레임워크/언어 선택이 호스팅과 **완전히 분리**됨 → 벤더 종속 탈출. Next.js도 `output: 'standalone'`으로 Docker 배포 잘 됨.
  - 로컬 = 프로덕션 환경 일치. DB, Redis, 워커를 `docker-compose.yml` 하나로 정의.
- **비용**: 컨테이너 하나 감쌀 줄 아는 순간, "이 프레임워크는 어디에 배포하지?"라는 고민이 사라진다. 게임/앱 개발 경험이 있다면 러닝커브는 하루 이틀 수준.

---

## 7. 시나리오별 추천

### A. 간단한 랜딩 페이지 / 블로그 (noxionite 포함)
```
Astro (또는 정적 Next.js) + Cloudflare Pages/Workers
```
- 비용 0원, 봇이 아무리 긁어도 과금 없음 (정적 대역폭 무제한).
- Notion 연동은 **빌드 타임에 fetch → 완전 정적 출력**으로 바꾸면 런타임 함수 호출 자체가 사라짐. 갱신은 Notion 웹훅/주기적 재빌드로.

### B. DB 포함 중간 규모 앱 (대시보드, 소규모 SaaS)
```
SvelteKit 또는 Next.js + Supabase        (서버 관리 없이)
또는
아무 프레임워크 + Docker + Hetzner VPS + Coolify + Postgres   (최저 비용)
```

### C. 복잡한 시스템 (실시간, 큐, 워커, 복잡한 권한)
```
프론트: Astro/Next(정적·가벼운 SSR) 또는 SvelteKit
백엔드: Go/Python(FastAPI/Django)/Node — Docker 컨테이너
인프라: Hetzner VPS + Dokploy/Coolify + Postgres + Redis
앞단: Cloudflare (무료 CDN + 봇 차단 + WAF)
```
- 월 €10~20으로 서비스 여러 개 + 봇 걱정 없는 구조.
- 트래픽이 진짜로 커지면 그때 서버 증설 또는 관리형으로 이전 — "성공한 뒤의 문제"는 그때 풀면 됨.

### D. 지금 당장 최소 변경으로 급한 불 끄기
1. Cloudflare DNS 프록시 + AI 크롤러 차단 규칙 (30분 작업)
2. noxionite의 SSR/ISR 페이지를 SSG로 최대 전환
3. 이후 여유 있을 때 A안(Cloudflare 이전) 진행

---

## 8. 최종 결론

| 질문 | 답 |
|---|---|
| Next.js + Vercel이 여전히 최고? | "가장 쉬움"은 맞지만, 무료 다중 프로젝트 운영자에게는 **아님**. 봇 트래픽 시대에 과금 모델이 불리 |
| DB가 포함되면? | Supabase(올인원) 또는 VPS에 직접 Postgres. Vercel의 우위는 더 줄어듦 |
| Docker를 쓴다면? | 선택지가 폭발적으로 넓어짐. VPS + Coolify/Dokploy로 Vercel 경험의 대부분을 고정비 €5~10/월에 재현 가능 |
| 복잡한 시스템은? | 서버리스보다 **Docker 기반 모놀리스 or 분리형**이 관리·비용·기능 제약 모두에서 유리 |

**한 줄 요약**: 콘텐츠는 Cloudflare에 정적으로, 시스템은 Docker로 싸서 VPS에 — 이 두 축을 갖추면 프레임워크는 그때그때 가장 편한 걸 골라 쓰면 된다.

---

## 참고 자료
- [Coolify vs Vercel Hosting Cost Comparison 2026](https://www.buildmvpfast.com/blog/coolify-vs-vercel-hosting-cost-comparison-self-hosted-2026)
- [10 Vercel Alternatives for Deploying Apps in 2026 — DigitalOcean](https://www.digitalocean.com/resources/articles/vercel-alternatives)
- [Best Vercel Alternatives in 2026 — Encore](https://encore.dev/articles/vercel-alternatives)
- [Next.js vs Remix vs Astro vs SvelteKit in 2026 — Pockit](https://pockit.tools/blog/nextjs-vs-remix-vs-astro-vs-sveltekit-2026-comparison/)
- [SvelteKit vs Next.js vs Astro: 2026 — Gigson](https://www.gigson.co/blog/sveltekit-vs-next-js-vs-astro-which-framework-wins-in-2026)
- [Supabase vs Neon: Serverless Postgres Compared (2026)](https://getautonoma.com/blog/supabase-vs-neon)
- [Serverless Postgres — Prisma](https://www.prisma.io/blog/serverless-postgres)
- [When to Use Vercel vs Railway vs Hetzner for Your Solo SaaS in 2026](https://devtoolpicks.com/blog/when-to-use-vercel-vs-railway-vs-hetzner-solo-saas-2026)
- [Railway vs Render vs Fly.io for Solo Developers in 2026](https://devtoolpicks.com/blog/railway-vs-render-vs-fly-io-solo-developers-2026)
- [Setup Dokploy on your VPS — Hetzner Community](https://community.hetzner.com/tutorials/setup-dokploy-on-your-vps/)
