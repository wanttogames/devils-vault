# Devil's Vault · 악마의 금고

욕심을 버리면 살아나갈 수 있다. 봉인 상자에서 보상을 얻고, 파산하기 전에 탈출하는 브라우저용 push-your-luck 로그라이트 게임입니다. 골드는 모두 게임 내 가상 재화이며 실제 현금 가치가 없습니다.

## 플레이

- 세 상자의 실제 결과는 매 라운드 weighted random으로 생성됩니다.
- 상자 단서와 표시된 RUIN 위험도를 보고 하나를 선택하세요.
- 보상마다 연승 배율이 적용되며, 다음 상자에 도전하거나 현재 골드를 확정하고 탈출할 수 있습니다.
- RUIN은 미확정 골드를 모두 잃게 합니다. 탈출하면 SOUL COIN을 받아 영구 업그레이드를 구매할 수 있습니다.
- 도박사·예언자·수집가·불사자 중 스타일을 고르고, 유물과 Fever 효과를 활용하세요.

## 기능

- Phaser 3 기반 분위기 연출과 반응형 HTML/CSS 게임 UI
- 골드, 배율 상승, 보물, 유물, 저주, RUIN, JACKPOT 상자
- 연승 배율, 라운드별 위험도, 상자 단서와 Near Miss 결과 공개
- 8종 유물, 4종 캐릭터, Double or Nothing, FEVER 게이지
- SOUL COIN 영구 업그레이드, 업적, 전적, 첫 판 튜토리얼
- localStorage 저장, 효과음·흔들림·움직임 설정
- 모바일 터치 입력 및 GitHub Pages 배포 워크플로

## 로컬 실행

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
npm run preview
```

## GitHub Pages

`main`에 push하면 `.github/workflows/deploy.yml`이 빌드 후 Pages에 배포합니다. 저장소 Settings → Pages에서 **GitHub Actions**를 배포 소스로 선택하세요.

## 주요 구조

```text
src/main.ts             Phaser 분위기 씬과 게임 흐름/UI
src/game/balance.ts     확률, 밸런스, 캐릭터, 유물, 데이터 타입
src/game/save.ts        버전형 localStorage 저장 관리
src/game/ui/art.ts      금고·상자·문양·아이콘 SVG 그래픽
src/style.css           다크 판타지 반응형 UI
.github/workflows/      GitHub Pages 배포
```

## 디자인 패치 (1.1)

금속 금고문과 붉은 봉인, 황동 상자, 캐릭터 계약서, 보상 HUD와 결과 화면을 새 디자인으로 통일했습니다. 모든 그래픽은 로컬 SVG로 그려져 해상도에 따라 선명하게 확대되며 외부 이미지·폰트 요청이 없습니다. 골드 숫자는 증가 애니메이션으로 표시하며 모바일 버튼은 최소 44px 터치 영역을 확보했습니다. 움직임 줄이기 설정과 키보드 포커스 표시를 지원합니다.
