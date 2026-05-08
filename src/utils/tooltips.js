/**
 * tooltips.js
 * 각 카드 및 도형 타입별 툴팁 설명 데이터
 */

// ── 카드 헤더 툴팁 ─────────────────────────────────────────
export const CARD_TOOLTIPS = {
  TITLE: {
    title: 'Title Card',
    desc: '입력 파일의 첫 번째 줄. MCNP가 문제를 식별하는 이름입니다. 80자 이내로 작성하세요.',
    code: 'Cask Shielding Problem - Run01',
  },
  CELL: {
    title: 'Cell Card',
    desc: '형상 공간을 정의합니다. 재질 번호, 밀도, 표면 조합식, 중요도(imp)를 입력합니다. 밀도는 음수=질량밀도(g/cc), 양수=원자밀도(atoms/b·cm).',
    code: `1  1  -11.35  -1 2 -3   imp:n=1
↑  ↑   ↑       ↑         ↑
셀# M# 밀도   표면식   중요도`,
  },
  SURF: {
    title: 'Surface Card',
    desc: '기하학적 경계면을 정의합니다. 도형 종류(RCC, CZ 등)를 선택하고 좌표·크기 파라미터를 입력합니다.',
    code: `1  RCC  0 0 0   0 0 200   50
↑   ↑   └────┘  └──────┘  ↑
번# 타입  중심좌표 방향벡터  반지름`,
  },
  DATA: {
    title: 'Data Card',
    desc: '시뮬레이션 제어 파라미터. 입자 종류(MODE), 중요도(IMP), 재질(M), 선원(SDEF/KCODE), 히스토리 수(NPS)를 설정합니다.',
    code: `MODE N P
IMP:N  1 1 1 0
SDEF POS=0 0 0 ERG=1.25 PAR=P
NPS 1000000`,
  },
};

// ── 도형 타입 툴팁 ─────────────────────────────────────────
export const SURF_TOOLTIPS = {
  RCC: {
    title: 'RCC — Right Circular Cylinder',
    desc: '유한한 직원기둥. Cask 외형 모델링에 가장 많이 사용합니다. 밑면 중심 좌표 + 축 방향벡터(= 높이) + 반지름 순서로 입력.',
    code: `1  RCC  0 0 0   0 0 200   50
         └─────┘  └──────┘  ↑
         중심(x y z) 벡터(vx vy vz) 반지름
→ z축 방향 원통, 높이 200cm, r=50cm`,
  },
  RPP: {
    title: 'RPP — Rectangular Parallelepiped',
    desc: '직육면체. 각 축 방향의 최솟값·최댓값 쌍으로 정의합니다.',
    code: `1  RPP  -50 50  -50 50  0 200
          xmin xmax ymin ymax zmin zmax`,
  },
  SPH: {
    title: 'SPH — Sphere (Macrobody)',
    desc: '임의 위치에 중심을 둔 구. 중심 좌표 + 반지름.',
    code: `1  SPH  0 0 100  50
         중심(x y z)   반지름`,
  },
  TRC: {
    title: 'TRC — Truncated Right-angle Cone',
    desc: '원뿔대. 아래·위 반지름이 다른 원뿔 형태. r2=0이면 완전한 원뿔.',
    code: `1  TRC  0 0 0   0 0 100   60  30
         중심  방향벡터  r_bottom r_top`,
  },
  BOX: {
    title: 'BOX — Arbitrarily Oriented Box',
    desc: '축에 평행하지 않은 기울어진 직육면체. 꼭짓점 + 세 변 벡터로 정의.',
    code: `1  BOX  ax ay az   bx by bz   cx cy cz   dx dy dz
         꼭짓점    벡터1      벡터2      벡터3`,
  },
  REC: {
    title: 'REC — Right Elliptical Cylinder',
    desc: '밑면이 타원형인 기둥. 중심 + 높이벡터 + 장축벡터 + 단축벡터.',
    code: `vz=100  ax=50 ay=0  bx=0 by=30`,
  },
  ELL: { title: 'ELL — Ellipsoid', desc: '두 초점과 장반경으로 정의되는 타원체.', code: 'v1x v1y v1z  v2x v2y v2z  r' },
  WED: { title: 'WED — Wedge', desc: '직각 삼각형 밑면의 쐐기 모양 입체.', code: 'ax ay az  bx by bz  cx cy cz  hx hy hz' },
  RHP: { title: 'RHP/HEX — Right Hexagonal Prism', desc: '정육각기둥. 원자로 육각 격자 집합체 모델링에 사용.', code: 'ax ay az  vx vy vz  r' },
  CX: { title: 'CX — Infinite Cylinder (X축)', desc: 'X축을 중심으로 하는 무한 원기둥. r만 입력.', code: `1  CX  50  ← 반지름 50cm\nPZ와 조합 불필요 (무한 원통)` },
  CY: { title: 'CY — Infinite Cylinder (Y축)', desc: 'Y축을 중심으로 하는 무한 원기둥.', code: '1  CY  50' },
  CZ: {
    title: 'CZ — Infinite Cylinder (Z축)',
    desc: 'Z축을 중심으로 하는 무한 원기둥. PZ 두 개와 조합하면 유한 원통 셀이 됩니다.',
    code: `1  CZ  50       ← 반지름
2  PZ  0        ← 아래 끝면
3  PZ  200      ← 위 끝면

셀 표면식: -1 2 -3  (내부)`,
  },
  SO: { title: 'SO — Sphere at Origin', desc: '원점이 중심인 구. r만 입력.', code: '1  SO  50  ← 반지름 50cm' },
  S:  { title: 'S — Sphere (임의 위치)', desc: '임의 위치에 중심을 둔 구.', code: '1  S   0 0 100  50  ← 중심+반지름' },
  SX: { title: 'SX — Sphere on X-axis', desc: 'X축 선상에 중심이 있는 구.', code: '1  SX  100  50  ← x위치, 반지름' },
  SY: { title: 'SY — Sphere on Y-axis', desc: 'Y축 선상에 중심이 있는 구.', code: '1  SY  100  50' },
  SZ: { title: 'SZ — Sphere on Z-axis', desc: 'Z축 선상에 중심이 있는 구.', code: '1  SZ  100  50' },
  PX: { title: 'PX — Plane ⊥ X', desc: 'X축에 수직인 무한 평면. 위치 d만 입력.', code: '1  PX  50  → x=50 평면' },
  PY: { title: 'PY — Plane ⊥ Y', desc: 'Y축에 수직인 무한 평면.', code: '1  PY  50' },
  PZ: {
    title: 'PZ — Plane ⊥ Z',
    desc: 'Z축에 수직인 무한 평면. CZ와 조합해 원통 끝면을 정의할 때 주로 사용.',
    code: `2  PZ  0      ← z=0 (아래 끝면)
3  PZ  200    ← z=200 (위 끝면)`,
  },
  'C/X': { title: 'C/X — Cylinder ∥ X', desc: 'X축에 평행하며 임의 위치의 무한 원기둥.', code: '1  C/X  y0 z0 r' },
  'C/Y': { title: 'C/Y — Cylinder ∥ Y', desc: 'Y축에 평행하며 임의 위치의 무한 원기둥.', code: '1  C/Y  x0 z0 r' },
  'C/Z': { title: 'C/Z — Cylinder ∥ Z', desc: 'Z축에 평행하며 임의 위치의 무한 원기둥.', code: '1  C/Z  x0 y0 r' },
  KX: { title: 'KX — Cone (X축)', desc: 'X축 대칭의 무한 원뿔. t²=tan²θ (반각의 탄젠트 제곱).', code: '1  KX  x0 t²\n→ x=x0에 꼭짓점, 기울기 t' },
  KY: { title: 'KY — Cone (Y축)', desc: 'Y축 대칭 무한 원뿔.', code: '1  KY  y0 t²' },
  KZ: { title: 'KZ — Cone (Z축)', desc: 'Z축 대칭 무한 원뿔.', code: '1  KZ  z0 t²' },
  TX: { title: 'TX — Torus (X축)', desc: 'X축 대칭 도넛(원환체). A=장반경, B·C=단반경(타원 단면).', code: '1  TX  x0 y0 z0  A B C' },
  TY: { title: 'TY — Torus (Y축)', desc: 'Y축 대칭 도넛.', code: '1  TY  x0 y0 z0  A B C' },
  TZ: { title: 'TZ — Torus (Z축)', desc: 'Z축 대칭 도넛.', code: '1  TZ  x0 y0 z0  A B C' },
  GQ: { title: 'GQ — General Quadric', desc: '기울어진 일반 2차 곡면. 10개 계수(A~K)로 정의.', code: 'Ax²+By²+Cz²+Dxy+Eyz+Fzx\n+Gx+Hy+Jz+K=0' },
  SQ: { title: 'SQ — Special Quadric', desc: '좌표축 평행 타원체·쌍곡면·포물면.', code: 'A B C D E F G  x0 y0 z0' },
};

// ── 셀 타입 툴팁 ───────────────────────────────────────────
export const CELL_TYPE_TOOLTIPS = {
  normal: {
    title: '일반 셀',
    desc: '재질이 채워진 일반 영역. 재질 번호(M#), 밀도, 표면 조합식, 중요도를 입력합니다. 밀도 음수=g/cc, 양수=atoms/b·cm.',
    code: `1  1  -11.35  -1 2 -3  imp:n=1
셀# M# 밀도(g/cc) 표면식  중요도`,
  },
  lat: {
    title: 'Lattice 셀',
    desc: '반복 격자 구조(연료집합체 등)를 정의합니다. LAT=1(사각), LAT=2(육각). 세부조정 패널의 Lattice Editor로 Fill을 시각적으로 편집하세요.',
    code: `2  0  -3  lat=1 u=2  imp:n=1
      fill=0:1 0:1 0:0
           1 1
           1 1`,
  },
  fill: {
    title: 'Fill 셀',
    desc: '다른 유니버스로 채워지는 셀. FILL= 뒤에 유니버스 번호를 입력합니다. Lattice 셀의 상위 용기로 사용.',
    code: `3  1  -6.56  -4  fill=2  imp:n=1
→ 4번 표면 내부를 유니버스 2로 채움`,
  },
  boundary: {
    title: '경계(Boundary) 셀',
    desc: '시뮬레이션 최외각 영역. 입자가 이 셀에 진입하면 추적 종료. 자동으로 IMP=0 적용. 반드시 하나 있어야 합니다.',
    code: `99  0  10  imp:n=0  $ Graveyard
→ 10번 표면 바깥쪽 (외부 경계)`,
  },
};

// ── Data Card 내부 항목 툴팁 ───────────────────────────────
export const DATA_TOOLTIPS = {
  MODE: {
    title: 'MODE 카드',
    desc: '시뮬레이션에서 추적할 입자 종류를 지정합니다. 차폐 계산은 보통 MODE N P (중성자+광자)를 씁니다.',
    code: `N  — 중성자 (Neutron)
P  — 광자/감마선 (Photon)
E  — 전자 (Electron)

예) MODE N P  → 중성자+감마선 동시 계산`,
  },
  MATERIAL: {
    title: 'Material 카드 (M)',
    desc: 'ZAID 형식: ZZZAAA.xxC (원소번호+질량수+라이브러리). 원자밀도(atoms/b·cm)를 입력합니다. PNNL Compendium 기반 데이터가 DB에 포함되어 있습니다.',
    code: `M1   82204.70c  1.37E-04  $ Pb-204
     82206.70c  2.36E-03  $ Pb-206
     82208.70c  5.13E-03  $ Pb-208
→ 재질 1번 = 납(Pb), 70c=ENDF/B-VII`,
  },
  SHIELD_MODE: {
    title: '차폐 모드 (SDEF)',
    desc: '외부 방사선 선원에서 방사선이 나오는 차폐 문제. SDEF 카드로 선원 위치·에너지·입자 종류를 정의합니다.',
    code: `SDEF  POS=0 0 0   ← 선원 위치 (x y z cm)
      ERG=1.25    ← 에너지 (MeV)
      PAR=P       ← 입자 (P=광자)`,
  },
  CRIT_MODE: {
    title: '임계 모드 (KCODE)',
    desc: '핵연료 keff(유효증배계수) 계산. KSRC로 초기 중성자 발생 위치를 지정합니다. 건식저장 임계안전 해석에 사용.',
    code: `KCODE  10000  1.0  50  250
       ↑      ↑    ↑    ↑
    N/cyc  keff₀  Ic   It`,
  },
  PAR: {
    title: 'PAR — 선원 입자 종류',
    desc: '선원에서 방출되는 입자 종류입니다.',
    code: `P  — 광자/감마선 (Co-60, Cs-137 차폐 계산)
N  — 중성자 (핵분열 중성자, 임계 계산)`,
  },
  ERG: {
    title: 'ERG — 선원 에너지 (MeV)',
    desc: '선원 입자의 초기 운동에너지(MeV). 스펙트럼은 ERG=D1 + SI1/SP1 카드 조합으로 입력합니다.',
    code: `ERG=1.25    ← Co-60 평균 에너지
ERG=0.662   ← Cs-137
ERG=D1      ← 분포 입력 (세부조정 SI/SP 사용)`,
  },
  POS: {
    title: 'POS — 선원 위치 (cm)',
    desc: '점선원의 기준 좌표. 분포 선원은 CEL(셀 내부) 또는 SUR(표면)을 추가 지정합니다.',
    code: `POS=0 0 0      ← 원점에 점선원
POS=0 0 100    ← z=100cm 위치`,
  },
  NPS: {
    title: 'NPS — 히스토리 수',
    desc: '추적할 총 입자 수. 클수록 통계 정밀도↑, 계산 시간↑. 상대 오차 5% 미만을 목표로 설정하세요.',
    code: `NPS  1000000    ← 100만 (빠른 테스트)
NPS  1E7        ← 1000만 (차폐 계산 권장)
NPS  1E8        ← 1억   (정밀 계산)`,
  },
  KCODE_N: {
    title: 'N/cycle — 사이클당 중성자 수',
    desc: '각 임계 사이클에서 추적할 중성자 수. 클수록 사이클별 통계가 좋아지고 keff 불확도가 낮아집니다.',
    code: '권장: 1000 ~ 100000\nCask 임계 계산: 10000 일반적',
  },
  KCODE_K: {
    title: 'keff₀ — 초기 keff 추정값',
    desc: '임계 계산 시작점. 보통 1.0으로 설정. 크게 틀려도 수렴 후에는 정확한 값으로 수렴합니다.',
    code: `임계 미만 (차폐 용기): 0.9 이하
임계 (자기유지 연쇄반응): 1.0
임계 초과 (핵폭발): 1.0 초과`,
  },
  KCODE_IC: {
    title: 'Ic — 비활성(Inactive) 사이클 수',
    desc: '통계 수집 전 건너뛸 사이클. 초기 fission 분포가 수렴할 때까지 필요합니다.',
    code: '권장: 전체 사이클(It)의 20~30%\n예: It=250 → Ic=50~75',
  },
  KCODE_IT: {
    title: 'It — 전체 사이클 수',
    desc: 'Ic(비활성) + 활성 사이클을 합한 총 수. It−Ic = 통계에 사용하는 사이클 수.',
    code: `Ic=50, It=250 → 활성 200사이클
통계 오차 5% 목표: 보통 200~500 활성`,
  },
};

// ── 세부조정 패널 툴팁 ─────────────────────────────────────
export const SLIDE_TOOLTIPS = {
  // Surface 세부조정
  TR: {
    title: 'TR / TRCL — 좌표 변환',
    desc: 'TR은 특정 표면에, TRCL은 셀 전체에 적용하는 이동·회전 변환입니다. 복잡한 기하학을 조합할 때 유용합니다.',
    code: `TR1  dx dy dz      ← 이동만
TR1  dx dy dz  Axx Ayx Azx  Axy ...
               ↑ 3×3 방향코사인 행렬

*TR — 각도(°) 직접 입력 가능`,
  },
  TRCL_ROTATE: {
    title: '회전 행렬 (방향코사인)',
    desc: '새 x\'축이 기존 xyz 축과 이루는 각도 코사인값 3개, y\'축 3개, z\'축 3개 순서로 입력합니다. *TR 옵션 체크 시 각도(°)로 입력 가능.',
    code: `항등행렬(회전 없음):
1 0 0
0 1 0
0 0 1

z축 기준 90° 회전:
0 1 0
-1 0 0
0 0 1`,
  },

  // Lattice / Cell 세부조정
  LATTICE: {
    title: 'Lattice / Universe 편집기',
    desc: '연료 집합체 등 반복 격자 구조를 시각적으로 정의합니다. 격자 크기를 설정하고, 팔레트에서 Universe를 선택한 뒤 셀을 클릭해 페인팅하세요.',
    code: `U1=연료 핀  U2=제어봉  U0=냉각재

FILL 결과 예시 (3×3):
fill=-1:1 -1:1 0:0
     1 2 1
     2 1 2
     1 2 1`,
  },
  LAT_TYPE: {
    title: 'LAT 타입',
    desc: 'LAT=1: 사각형 격자 (PWR 연료집합체)\nLAT=2: 육각형 격자 (VVER, 연구로)',
    code: `LAT=1  직사각형 배열 (4면)
LAT=2  육각형 배열 (6면)`,
  },
  UNIVERSE: {
    title: 'Universe (U)',
    desc: '독립적인 기하학 공간 번호. U=0이 메인 공간, U>0은 하위 유니버스입니다. Lattice의 Fill에서 각 칸에 배치됩니다.',
    code: `U=0  기본 공간 (메인 기하학)
U=1  연료 핀 유니버스
U=2  제어봉 유니버스`,
  },

  // Tally / Data 세부조정
  IMP: {
    title: 'IMP — Importance 카드',
    desc: '각 셀에서 입자 추적의 중요도를 설정합니다. 경계 셀은 반드시 0. 분산감소(VRT)에서 비율로 입자를 분기/소멸시킵니다.',
    code: `IMP:N  1 1 1 1 0
         셀1 2 3 4 5(경계)

일반 셀 = 1
경계(Graveyard) 셀 = 0 (필수)`,
  },
  SI: {
    title: 'SI — Source Information',
    desc: '선원 분포의 구간(bin) 정보. H=히스토그램 경계, L=이산값, A=확률밀도 함수.',
    code: `SI1  H  0  1.17  1.33  2.0
      ↑   ↑  └──── 에너지 구간 (MeV) ────┘
    번호 타입(H)

H: 경계값 나열 → SP로 확률 지정`,
  },
  SP: {
    title: 'SP — Source Probability',
    desc: 'SI 카드에 대응하는 확률값. 구간 면적이 확률에 비례합니다. 첫 값은 항상 0.',
    code: `SP1  0  0.5  0.5  0
      ↑  ↑   ↑    ↑   ↑
    번호  각 구간 상대 확률

Co-60: 1.17MeV·1.33MeV 각 50%`,
  },
  TALLY_F: {
    title: 'Tally 카드 (F)',
    desc: '시뮬레이션 결과를 추출하는 검출기. 타입 번호에 입자 종류를 붙여 씁니다.',
    code: `F4:N   1 2 3    셀 1,2,3 중성자 플럭스 (n/cm²·s)
F2:P   10       표면 10 광자 전류
F5:P   0 0 300  점검출기 (좌표 직접 지정)
F6:P   1        에너지 침적 (MeV/g)

F1: 전류  F2: 플럭스(면)  F4: 플럭스(셀)
F5: 점    F6: 열침적     F8: 펄스높이`,
  },
  FM: {
    title: 'FM — Flux Multiplier',
    desc: 'Tally 결과에 반응률·선량률 계산을 위한 곱셈 인자를 적용합니다.',
    code: `FM4  -1  1  -5  -6
      ↑   ↑  ↑   ↑   ↑
   계수  M# 반응번호(복수)

계수=-1: 단위 정규화
-5: 플럭스→선량 (KERMA)
-6: 가열 단면적`,
  },
  E_BIN: {
    title: 'E 카드 — 에너지 구간 (Tally)',
    desc: 'Tally 결과를 에너지 구간별로 분리합니다. 스펙트럼 분석, 에너지별 선량 기여도 분석에 사용.',
    code: `E4  0.01 0.1 0.5 1.0 2.0 5.0 10.0
     ↑   └──────── MeV 단위 (오름차순) ─┘
   번호

마지막 값 = 최대 에너지 (보통 20MeV)`,
  },
  DE_DF: {
    title: 'DE/DF — 선량 환산 인자 (ICRP-21)',
    desc: '플럭스(n·cm⁻²·s⁻¹ or γ·cm⁻²·s⁻¹)를 인체 선량(pSv/h)으로 변환. FM 카드와 조합해 선량률을 계산합니다.',
    code: `DE4  0.01  0.1  1.0  10.0   ← 에너지(MeV)
DF4  2.8E-5 1.1E-5 1.1E-5 6.3E-5  ← pSv·cm²

선량률(μSv/h) = 플럭스 × DF × 3600 × 1E-6`,
  },
  FMESH: {
    title: 'FMESH — 메시 Tally',
    desc: '기하학과 독립적인 3D 직교 격자를 겹쳐 공간 분포를 계산합니다. Cask 외부 선량 분포 시각화, 열점(hot spot) 탐색에 사용.',
    code: `FMESH14:p  geom=xyz
           origin=-150 -150 -32
           imesh=150   iints=50
           jmesh=150   jints=50
           kmesh=230   kints=50
           out=xdmf
→ XDMF 출력 → ParaView 3D 시각화`,
  },
  KSRC: {
    title: 'KSRC — 초기 중성자 위치',
    desc: '임계 계산(KCODE) 시 초기 중성자 발생 위치를 지정합니다. 핵연료 내부에 설정해야 빠른 수렴을 얻을 수 있습니다.',
    code: `KSRC  0 0 100
      ↑  x y z 좌표 (cm)

여러 점 지정:
KSRC  0 0 50   0 0 150   0 0 250`,
  },
};
