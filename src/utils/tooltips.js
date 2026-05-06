/**
 * tooltips.js
 * 각 카드 및 도형 타입별 툴팁 설명 데이터
 */

export const CARD_TOOLTIPS = {
  TITLE: {
    title: 'Title Card',
    desc: '입력 파일의 첫 번째 줄입니다. MCNP가 문제를 식별하는 이름입니다. 80자 이내로 작성하세요.',
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
    desc: '시뮬레이션 제어 파라미터를 입력합니다. 입자 종류(MODE), 중요도(IMP), 재질(M), 선원(SDEF/KCODE), 히스토리 수(NPS)를 설정합니다.',
    code: `MODE N P
IMP:N  1 1 1 0
SDEF POS=0 0 0 ERG=1.25 PAR=P
NPS 1000000`,
  },
};

export const SURF_TOOLTIPS = {
  RCC: {
    title: 'RCC — Right Circular Cylinder',
    desc: '직원기둥(유한한 원통). Cask 외형 모델링에 가장 많이 사용.',
    code: `vx=0  vy=0  vz=200  r=50
→ z축 방향, 높이 200cm, 반지름 50cm`,
    params: {
      'x₀': '밑면 중심 x 좌표 (cm)',
      'y₀': '밑면 중심 y 좌표 (cm)',
      'z₀': '밑면 중심 z 좌표 (cm)',
      'vx': '축 방향벡터 x성분',
      'vy': '축 방향벡터 y성분',
      'vz': '축 방향벡터 z성분 (= 높이)',
      'r':  '반지름 (cm)',
    },
  },

  RPP: {
    title: 'RPP — Rectangular Parallelepiped',
    desc: '직육면체. 각 축 방향 최솟값·최댓값으로 정의.',
    code: `xmin=-50 xmax=50
ymin=-50 ymax=50
zmin=0   zmax=200`,
    params: {
      'xmin': 'X 최솟값', 'xmax': 'X 최댓값',
      'ymin': 'Y 최솟값', 'ymax': 'Y 최댓값',
      'zmin': 'Z 최솟값', 'zmax': 'Z 최댓값',
    },
  },

  SPH: {
    title: 'SPH — Sphere',
    desc: '구. 임의 위치에 중심을 두고 반지름으로 정의.',
    code: 'vx=0  vy=0  vz=0  r=50\n→ 원점 중심, 반지름 50cm',
    params: {
      'vx': '중심 x', 'vy': '중심 y', 'vz': '중심 z', 'r': '반지름',
    },
  },

  TRC: {
    title: 'TRC — Truncated Right-angle Cone',
    desc: '원뿔대. 아래 반지름(r1)과 위 반지름(r2)이 다른 원뿔 형태.',
    code: `vz=100  r1=60  r2=30
→ 높이 100cm, 아래 r=60, 위 r=30`,
    params: {
      'x₀':'밑면 중심 x', 'y₀':'밑면 중심 y', 'z₀':'밑면 중심 z',
      'vx':'방향벡터 x', 'vy':'방향벡터 y', 'vz':'방향벡터 z (= 높이)',
      'r1':'밑면 반지름', 'r2':'윗면 반지름',
    },
  },

  BOX: {
    title: 'BOX — Arbitrarily Oriented Box',
    desc: '임의 방향으로 기울어진 직육면체. 꼭짓점과 세 변 벡터로 정의.',
    code: `밑면 꼭짓점: ax ay az
세 변 벡터:  bx by bz
             cx cy cz
             dx dy dz`,
  },

  REC: {
    title: 'REC — Right Elliptical Cylinder',
    desc: '밑면이 타원인 기둥.',
    code: `vx=0 vy=0 vz=100   (높이벡터)
ax=50 ay=0 az=0   (장축벡터)
bx=0  by=30 bz=0  (단축벡터)`,
  },

  ELL: {
    title: 'ELL — Ellipsoid',
    desc: '타원체. 두 초점과 장반경으로 정의.',
    code: 'v1x v1y v1z  v2x v2y v2z  r',
  },

  WED: {
    title: 'WED — Wedge',
    desc: '직각 삼각형 밑면의 쐐기 모양.',
    code: 'ax ay az  bx by bz  cx cy cz  hx hy hz',
  },

  'RHP': {
    title: 'RHP/HEX — Right Hexagonal Prism',
    desc: '정육각기둥. 육각 격자 집합체 모델링에 사용.',
    code: 'ax ay az  vx vy vz  r',
  },

  CX: { title: 'CX — Cylinder (X축 중심)', desc: 'X축을 중심으로 하는 무한 원기둥.', code: 'r=50 → 반지름 50cm' },
  CY: { title: 'CY — Cylinder (Y축 중심)', desc: 'Y축을 중심으로 하는 무한 원기둥.', code: 'r=50' },
  CZ: { title: 'CZ — Cylinder (Z축 중심)', desc: 'Z축을 중심으로 하는 무한 원기둥. PZ와 조합해 유한 원통 셀 구성.', code: `CZ  50        ← 반지름
PZ  0         ← 아래 뚜껑
PZ  200       ← 위 뚜껑` },

  SO: { title: 'SO — Sphere (원점)', desc: '원점이 중심인 구.', code: 'r=50' },
  S:  { title: 'S — Sphere (임의 위치)', desc: '임의 위치에 중심을 둔 구.', code: 'x0 y0 z0 r' },
  SX: { title: 'SX — Sphere (X축 선상)', desc: 'X축 위에 중심이 있는 구.', code: 'x0 r' },
  SY: { title: 'SY — Sphere (Y축 선상)', desc: 'Y축 위에 중심이 있는 구.', code: 'y0 r' },
  SZ: { title: 'SZ — Sphere (Z축 선상)', desc: 'Z축 위에 중심이 있는 구.', code: 'z0 r' },

  PX: { title: 'PX — Plane (X축 수직)', desc: 'X축에 수직인 무한 평면.', code: 'd=0  → x=0 평면' },
  PY: { title: 'PY — Plane (Y축 수직)', desc: 'Y축에 수직인 무한 평면.', code: 'd=0  → y=0 평면' },
  PZ: { title: 'PZ — Plane (Z축 수직)', desc: 'Z축에 수직인 무한 평면. CZ와 조합해 원통 끝면 정의.', code: 'd=200 → z=200 평면' },

  'C/X': { title: 'C/X — Cylinder (X축 평행)', desc: 'X축에 평행하며 임의 위치의 무한 원기둥.', code: 'y0 z0 r' },
  'C/Y': { title: 'C/Y — Cylinder (Y축 평행)', desc: 'Y축에 평행하며 임의 위치의 무한 원기둥.', code: 'x0 z0 r' },
  'C/Z': { title: 'C/Z — Cylinder (Z축 평행)', desc: 'Z축에 평행하며 임의 위치의 무한 원기둥.', code: 'x0 y0 r' },

  KX: { title: 'KX — Cone (X축)', desc: 'X축을 대칭축으로 하는 무한 원뿔.', code: 'x0 t²  (t²=tan²θ)' },
  KY: { title: 'KY — Cone (Y축)', desc: 'Y축을 대칭축으로 하는 무한 원뿔.', code: 'y0 t²' },
  KZ: { title: 'KZ — Cone (Z축)', desc: 'Z축을 대칭축으로 하는 무한 원뿔.', code: 'z0 t²' },

  TX: { title: 'TX — Torus (X축)', desc: 'X축 대칭의 도넛(원환체).', code: 'x0 y0 z0  A B C\nA=장반경, B=C=단반경' },
  TY: { title: 'TY — Torus (Y축)', desc: 'Y축 대칭의 도넛.', code: 'x0 y0 z0  A B C' },
  TZ: { title: 'TZ — Torus (Z축)', desc: 'Z축 대칭의 도넛.', code: 'x0 y0 z0  A B C' },

  GQ: { title: 'GQ — General Quadric', desc: '기울어진 일반 2차 곡면. 10개 계수(A~K)로 정의.', code: 'Ax²+By²+Cz²+Dxy+Eyz+Fzx\n+Gx+Hy+Jz+K=0' },
  SQ: { title: 'SQ — Special Quadric', desc: '좌표축에 평행한 타원체·쌍곡면·포물면.', code: 'A B C D E F G  x0 y0 z0' },
};

export const CELL_TYPE_TOOLTIPS = {
  normal: {
    title: '일반 셀',
    desc: '재질이 채워진 일반 영역. 재질 번호(M#), 밀도, 표면식을 입력합니다.',
    code: `1  1  -11.35  -1 2 -3  imp:n=1
셀# M# 밀도    표면식      중요도`,
  },
  lat: {
    title: 'Lattice 셀',
    desc: '격자 구조(연료 집합체 등)를 정의합니다. LAT=1(사각), LAT=2(육각). Fill로 유니버스를 채웁니다.',
    code: `2  0  -3  lat=1 u=2  imp:n=1
      fill=0:1 0:1 0:0
           1 1
           1 1`,
  },
  fill: {
    title: 'Fill 셀',
    desc: '다른 유니버스로 채워지는 셀. FILL= 뒤에 유니버스 번호를 입력합니다.',
    code: `3  1  -6.56  -4  fill=2  imp:n=1
→ 4번 표면 내부를 유니버스 2로 채움`,
  },
  boundary: {
    title: '경계(Boundary) 셀',
    desc: '시뮬레이션 외부 영역. 입자가 이 셀에 들어오면 추적 종료. 자동으로 IMP=0 적용.',
    code: `99  0  10  imp:n=0  $ Boundary
→ 10번 표면 바깥쪽`,
  },
};

// ── Data Card 내부 항목 툴팁 ────────────────────────────────
export const DATA_TOOLTIPS = {
  MODE: {
    title: 'MODE 카드',
    desc: '시뮬레이션에서 추적할 입자 종류를 지정합니다. 여러 개를 동시에 선택할 수 있습니다.',
    code: `N  — 중성자 (Neutron)
P  — 광자/감마선 (Photon)
E  — 전자 (Electron)

예) MODE N P  → 중성자 + 감마선 동시 계산`,
  },

  MATERIAL: {
    title: 'Material 카드 (M)',
    desc: 'MCNP 재질 카드입니다. 재질 번호(M1~)와 각 동위원소의 ZAID·원자밀도를 입력합니다. ZAID 형식: ZZZAAA.xxC (원소번호+질량수+라이브러리).',
    code: `M1   82204.70c  1.37E-04  $ Pb-204
     82206.70c  2.36E-03  $ Pb-206
     82208.70c  5.13E-03  $ Pb-208
→ 재질 1번 = 납(Pb)`,
  },

  SHIELD_MODE: {
    title: '차폐 모드 (SDEF)',
    desc: '외부 선원에서 방사선이 나오는 차폐 문제. SDEF 카드로 선원 위치·에너지·입자 종류를 정의합니다.',
    code: `SDEF  POS=0 0 0   ← 선원 위치 (x y z)
      ERG=1.25    ← 에너지 (MeV)
      PAR=P       ← 입자 종류 (P=광자)`,
  },

  CRIT_MODE: {
    title: '임계 모드 (KCODE)',
    desc: '핵연료 임계 계산. keff(유효증배계수)를 구합니다. KSRC로 초기 중성자 위치를 지정합니다.',
    code: `KCODE  10000  1.0  50  250
       ↑      ↑    ↑    ↑
    N/cycle keff₀  Ic   It

N/cycle: 사이클당 중성자 수
keff₀  : 초기 keff 추정값 (보통 1.0)
Ic     : 비활성 사이클 수
It     : 전체 사이클 수`,
  },

  PAR: {
    title: 'PAR — 선원 입자 종류',
    desc: '선원에서 발생하는 입자 종류를 지정합니다.',
    code: `P  — 광자/감마선 (Co-60, Cs-137 등 감마선원)
N  — 중성자 (핵분열 중성자 등)`,
  },

  ERG: {
    title: 'ERG — 선원 에너지',
    desc: '선원 입자의 초기 운동에너지(MeV). 단일값이면 단에너지, 스펙트럼은 SI/SP 카드와 함께 ERG=D1로 입력.',
    code: `ERG=1.25    ← Co-60 평균 에너지
ERG=0.662   ← Cs-137
ERG=D1      ← 분포 입력 (SI1/SP1 사용)`,
  },

  POS: {
    title: 'POS — 선원 위치',
    desc: '선원의 기준 위치 좌표(cm). 점선원이면 POS, 면적/부피 선원이면 CEL이나 SUR과 함께 사용.',
    code: `POS=0 0 0    ← 원점에 선원
POS=0 0 100  ← z=100cm 위치`,
  },

  NPS: {
    title: 'NPS — 히스토리 수',
    desc: '추적할 총 입자 수(히스토리). 클수록 통계 정밀도가 높아지지만 계산 시간이 증가합니다.',
    code: `NPS  1000000    ← 100만 히스토리
NPS  1E7        ← 1000만 히스토리

차폐 계산: 보통 1E6 ~ 1E8
정밀 계산: 1E8 이상 권장`,
  },

  KCODE_N: {
    title: 'N/cycle — 사이클당 중성자 수',
    desc: '각 임계 계산 사이클에서 추적할 중성자 수. 클수록 각 사이클의 통계가 좋아집니다.',
    code: '보통 1000 ~ 100000\nCask 계산: 10000 권장',
  },

  KCODE_K: {
    title: 'keff₀ — 초기 keff 추정값',
    desc: '임계 계산의 초기 유효증배계수 추정값. 보통 1.0으로 설정.',
    code: `임계 미만: 0.9 이하
임계:      1.0
임계 초과: 1.0 초과`,
  },

  KCODE_IC: {
    title: 'Ic — 비활성 사이클 수',
    desc: '통계 수집을 시작하기 전 건너뛸 사이클 수. 초기 fission 분포 수렴에 필요.',
    code: '보통 50 ~ 200\n전체 사이클의 20~30% 권장',
  },

  KCODE_IT: {
    title: 'It — 전체 사이클 수',
    desc: '비활성 + 활성 사이클을 포함한 총 사이클 수. It - Ic = 통계 수집 사이클 수.',
    code: `Ic=50, It=250 → 200사이클 통계
통계 불확도 5% 목표: 보통 200~500`,
  },
};

// ── 세부조정 패널 툴팁 ──────────────────────────────────────
export const SLIDE_TOOLTIPS = {
  IMP: {
    title: 'IMP — Importance 카드',
    desc: '각 셀에서 입자 추적의 중요도를 설정합니다. 0이면 해당 셀 진입 시 추적 종료(경계 셀). 분산감소기법(VRT)에서 중요도 비율로 입자를 분기/소멸시킵니다.',
    code: `IMP:N  1 1 1 1 0
         ↑ ↑ ↑ ↑ ↑
      셀1 2 3 4 5(경계)

모든 일반 셀 = 1
경계 셀 = 0 (필수)`,
  },

  SI: {
    title: 'SI — Source Information',
    desc: '선원 분포의 구간(bin) 정보를 정의합니다. H=히스토그램, L=이산값, A=확률밀도.',
    code: `SI1  H  0  1.17  1.33  2.0
      ↑   ↑  ↑    ↑     ↑
    번호 타입  에너지 구간 (MeV)

H: 히스토그램 경계값`,
  },

  SP: {
    title: 'SP — Source Probability',
    desc: 'SI 카드에 대응하는 확률값. 각 구간의 상대 확률(또는 확률밀도)을 입력합니다.',
    code: `SP1  0  0.5  0.5  0
      ↑  ↑   ↑    ↑   ↑
    번호  각 구간 확률

Co-60: 1.17 MeV와 1.33 MeV
각 50% 확률로 발생`,
  },

  TALLY_F: {
    title: 'Tally 카드 (F)',
    desc: '시뮬레이션 결과를 추출하는 검출기 카드. 셀/표면 번호와 입자 종류를 지정합니다.',
    code: `F4:N   1 2 3    ← 셀 1,2,3의 중성자 플럭스
F2:P   10       ← 표면 10의 광자 전류
F5:P   0 0 300  ← 좌표(0,0,300)의 점검출기

F1: 표면 전류  F2: 표면 플럭스
F4: 셀 플럭스  F5: 점 검출기
F6: 에너지 침적  F8: 펄스높이`,
  },

  FM: {
    title: 'FM — Flux Multiplier',
    desc: 'Tally 결과에 반응률 계산을 위한 곱셈 인자를 적용합니다. 선량률, 반응률 계산에 사용.',
    code: `FM4  -1  1  -5  -6
      ↑   ↑  ↑   ↑   ↑
   계수  M# 반응번호

계수 = 선원 강도 (Bq/s 등)
-5: 플럭스→선량 환산
-6: 가열 단면적`,
  },

  E_BIN: {
    title: 'E 카드 — 에너지 구간',
    desc: 'Tally 결과를 에너지 구간별로 분할합니다. 에너지 스펙트럼 분석에 사용.',
    code: `E4  0.01 0.1 0.5 1.0 2.0 5.0 10.0
     ↑   └─────────── MeV 단위 ──────────┘
   번호  에너지 경계값 (오름차순)

마지막 값 = 최대 에너지`,
  },

  DE_DF: {
    title: 'DE/DF — 선량 환산 인자',
    desc: '플럭스(F2/F4/F5)를 인체 선량(μSv/h)으로 변환하는 에너지별 환산 인자입니다. ICRP-21 기준 사용.',
    code: `DE4  0.01  0.1  1.0  10.0    ← 에너지 (MeV)
DF4  2.8E-5  1.1E-5  1.1E-5  6.3E-5  ← 환산인자 (pSv·cm²)

선량률(μSv/h) = 플럭스 × DF × 3600 × 1E-6`,
  },

  FMESH: {
    title: 'FMESH — 메시 Tally',
    desc: '기하학 구조와 독립적인 3D 격자를 겹쳐 공간 분포를 계산합니다. Cask 외부 선량 분포 시각화에 사용.',
    code: `FMESH14:p  geom=xyz
           origin=-150 -150 -32
           imesh=150   iints=50
           jmesh=150   jints=50
           kmesh=230   kints=50
           out=xdmf

ParaView로 3D 선량 분포 시각화 가능`,
  },

  KSRC: {
    title: 'KSRC — 초기 중성자 위치',
    desc: '임계 계산(KCODE) 시 초기 중성자 발생 위치를 지정합니다. 핵연료 영역 내부에 설정해야 합니다.',
    code: `KSRC  0 0 100
      ↑
  x y z 좌표 (cm)

여러 점 지정 가능:
KSRC  0 0 50   0 0 150   0 0 250`,
  },

  LATTICE: {
    title: 'Lattice / Universe 편집기',
    desc: '연료 집합체 등 반복 격자 구조를 정의합니다. 각 격자 위치에 Universe를 페인팅합니다.',
    code: `LAT=1  사각형 격자
LAT=2  육각형 격자 (원자로 집합체)

fill=-1:1 -1:1 0:0
     U1 U2 U1
     U2 U1 U2
     U1 U2 U1

U=0: 외부/공간
U=1,2...: 연료/냉각재 핀 유니버스`,
  },
};
