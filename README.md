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

## Deep Vaults 업데이트 (2.0)

한 RUN은 **19개 일반 라운드**를 거쳐 B1 → B5로 내려갑니다. 연승과 층 라운드는 독립적입니다. 매 라운드 탈출할 수 있고, 층의 마지막 봉인을 풀면 보너스를 받으며 탈출 또는 하강을 선택합니다. B5 클리어 뒤에는 탈출하거나 단 하나의 MYTHIC 마지막 상자를 열 수 있습니다. 마지막 상자는 JACKPOT 30%, ×10 25%, 신화 보물 20%, RUIN 25%입니다. 캐릭터의 부활과 보험은 이 봉인에도 적용됩니다.

| 층 | 일반 라운드 | 골드·보물 보상 배율 | 기본 위험 보정 | 특수방 확률 | 클리어 보너스 |
| --- | ---: | ---: | ---: | ---: | --- |
| B1 잊힌 금고 | 3 | ×1 | +0%p | 5% | 현재 골드 +5% |
| B2 탐욕의 금고 | 3 | ×1.4 | +3%p | 8% | 랜덤 유물 |
| B3 피의 금고 | 4 | ×2 | +7%p | 12% | 보물 |
| B4 저주받은 금고 | 4 | ×3 | +12%p | 16% | JACKPOT 게이지 +25%p |
| B5 악마의 심층 금고 | 5 | ×5 | +20%p | 22% | 심층의 왕관 + 최종 선택 |

상자는 COMMON / UNCOMMON / RARE / EPIC / LEGENDARY / MYTHIC 여섯 등급입니다. 등급은 결과와 별개이며 높은 등급도 저주나 RUIN이 가능합니다. 재질, 붉은 문양, 사슬, 왕실 봉인, 크기, 광채, 입자와 소리가 등급에 따라 달라집니다. 일반 방의 MYTHIC은 B4부터 등장하고 B5에서 10%입니다. 상자별 RUIN 수치는 보상 가중치를 정규화한 실제 생성 확률입니다. 힌트는 캐릭터·통찰·유물 능력이 있을 때만 내용을 드러냅니다.

특수방은 일반 라운드 사이에 발견되며 모두 입장/지나가기 선택이 가능합니다. 방 선택은 일반 층 라운드 수를 늘리지 않습니다. 특수방을 떠난 다음 일반 라운드에서는 다시 특수방이 등장하지 않습니다. 기본 RUN당 최대 4개, 최소 0개입니다.

- **Gold Vault:** RARE 이상 3개, 한 개 선택, 금화 강화, 저주·RUIN 없음.
- **Blood Vault:** 선택 입장, EPIC 이상, 보상 ×4, RUIN 위험 ×2 (85% 상한), 저주와 JACKPOT 증가.
- **Cursed Vault:** 동일한 EPIC 봉인 3개, 섞인 두 보상과 한 함정. 함정은 50% 저주 / 50% RUIN이므로 정보가 없는 상자 하나의 RUIN은 16.7%입니다. 능력 힌트는 그대로 적용됩니다.
- **Relic Vault:** 이름과 효과가 공개된 서로 다른 유물 3개 중 한 개 선택. 중복 획득 시 소모형 유물을 재충전합니다.
- **Devil’s Shop:** 현재 RUN 골드로 유물 구매. 실제 골드 차감, 잔액 부족·중복 구매 방지. Soul Coin은 소비하지 않습니다.

### 코드와 밸런스

- `src/game/data/floors.ts`: 층 수·라운드·보상·위험·등급 분포·특수방 확률·클리어 보너스·전환 시간.
- `src/game/data/chestTiers.ts`: 등급 보상 배율·위험 보정·보상 종류 가중치·색상·설명.
- `src/game/data/specialVaults.ts`: 특수방별 배율·선택 가중치·RUN 최소/최대·쿨다운·상점 가격·최종 상자 확률.
- `src/game/balance.ts`: 기존 캐릭터·유물·메타 업그레이드·연승 배율과 공통 타입/보상 가치 계산.
- `src/game/systems/`: `FloorManager`, `ChestTierManager`, `SpecialVaultManager`, `RewardManager`, `RunManager`, `VaultFlow`.
- `src/game/ui/vault.ts`, `src/game/ui/art.ts`, `src/style.css`: 층 HUD·선택 카드·등급 외형·반응형 화면·이동 연출.

금화/보물/JACKPOT은 기존 `rewardValue`를 통해 층 × 등급 × 특수방 보정을 받습니다. 배율 결과는 기존 RUN 골드에 적용되며 등급·특수방이 제안 배율을 강화합니다. 강한 저주는 40% 골드 손실을 줄 수 있고, 위험 저주는 RUN 위험 +5%p로 실제 누적됩니다. 보험·불사·검은 동전·통찰·Fever·왕관·황금 손 등은 같은 보상 경로를 사용합니다. 탐욕의 반지의 -10%는 실제 탈출 골드에 적용됩니다.

영구 저장은 기존 `devils-vault-save-v1` 키를 유지하며 내용 버전 2로 마이그레이션합니다. 기존 골드·업그레이드·업적·설정을 보존하고 새 통계에 기본값을 채웁니다. RUN은 새로고침 때 복구하지 않는 기존 방침을 유지합니다. Retry는 층·특수방·등급 카운터와 위험 보정을 모두 초기화합니다.

### 검증

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

브라우저 테스트는 Vite를 실행하고 실제 페이지에서 19개 라운드·층 선택·B5 마지막 상자·특수방 5종·Blood 건너뛰기·한 개 선택 제한·Retry·영구 저장·360px 세로 터치·가로 overflow·브라우저 오류를 검증합니다. 캡처는 `test-results/`에 저장됩니다. 이미 설치된 Chromium은 `VAULT_BROWSER_EXECUTABLE=/path/to/chromium npm run test:browser`로 지정할 수 있습니다. 포트 5173을 비워 두세요.

`npm test`는 결정적인 시드로 13개 테스트를 실행합니다. 층별 등급 분포 50만 회, 보상 생성 22.5만 회를 샘플링하며 위험 수치와 결과 가중치 일치, 특수방 구조, 쿨다운·최대/최소, 상점 차감, 저장 마이그레이션, 유물 상호작용을 확인합니다. GitHub Pages 워크플로도 테스트를 통과한 빌드만 배포합니다.

확률 샘플의 평균 골드는 연승 0의 도박사·업그레이드 없는 조건에서 금화/보물/JACKPOT 지급값만 계산합니다. 기존 RUN 골드의 손실이나 배율·유물의 간접 효과를 포함한 최종 순이익 추정은 아닙니다.

Pages에서 확인할 항목: B1~B5 진행도, 하강 시 잠금·이동·색감, LEGENDARY/MYTHIC 봉인 차이, Blood 입장/건너뛰기, 거래소 잔액 차감, 결과의 등급 통계, 재접속 뒤 영구 기록, 모바일 버튼과 움직임 줄이기 설정. 자동 모바일 검증은 Chromium 터치 에뮬레이션이며 실제 iOS/Safari 기기의 사운드·성능은 추가 확인이 필요합니다.
