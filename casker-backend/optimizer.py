"""
SciPy 기반 MCNP 차폐체 두께 최적화 모듈.

물리 모델:
  - 단순 감쇠: I = I₀ × exp(−μρx)
  - 빌드업 포함: D = B(μρx) × I₀ × exp(−μρx)   (Berger 근사)

주요 함수:
  - required_thickness(): 목표 선량 감소에 필요한 두께 계산
  - dose_at_thickness(): 주어진 두께에서의 선량 계산
  - optimize_multilayer(): 다층 차폐체 최적화 (총 두께 고정, 재질 배분)
"""

import numpy as np
from scipy.optimize import brentq, minimize
from typing import Optional


# ---------------------------------------------------------------------------
# 재질 데이터 (NIST XCOM 기준, 에너지별 질량 감쇠 계수 μ/ρ [cm²/g])
# ---------------------------------------------------------------------------
# 에너지 노드 [MeV]: 0.1, 0.2, 0.3, 0.5, 0.662, 0.8, 1.0, 1.25, 1.33, 1.5, 2.0, 3.0
_ENERGIES = [0.1, 0.2, 0.3, 0.5, 0.662, 0.8, 1.0, 1.25, 1.33, 1.5, 2.0, 3.0]

MATERIAL_DATA: dict[str, dict] = {
    "lead": {
        "name": "납 (Pb)",
        "density": 11.35,   # g/cm³
        "mu_rho": [5.549, 0.9985, 0.3751, 0.1609, 0.1248, 0.1064, 0.07102, 0.05994, 0.05824, 0.05182, 0.04609, 0.04191],
    },
    "concrete": {
        "name": "콘크리트 (MCNP)",
        "density": 2.35,
        "mu_rho": [0.1741, 0.1188, 0.09477, 0.07274, 0.0820, 0.06580, 0.06040, 0.05652, 0.05509, 0.05198, 0.04475, 0.03765],
    },
    "water": {
        "name": "물 (H₂O)",
        "density": 1.0,
        "mu_rho": [0.1675, 0.1370, 0.1186, 0.09687, 0.08569, 0.07872, 0.07072, 0.06323, 0.06146, 0.05754, 0.04942, 0.03969],
    },
    "iron": {
        "name": "철 (Fe) / SS304",
        "density": 7.87,
        "mu_rho": [0.3717, 0.1436, 0.09446, 0.07043, 0.07451, 0.06504, 0.05957, 0.05188, 0.05000, 0.04584, 0.04253],
    },
    "hdpe": {
        "name": "HDPE (고밀도 폴리에틸렌)",
        "density": 0.95,
        "mu_rho": [0.1891, 0.1543, 0.1334, 0.1085, 0.09600, 0.08821, 0.07932, 0.07086, 0.06887, 0.06449, 0.05538, 0.04448],
    },
    "b4c": {
        "name": "탄화붕소 (B₄C)",
        "density": 2.52,
        "mu_rho": [0.2230, 0.1587, 0.1273, 0.09670, 0.08470, 0.07710, 0.06900, 0.06160, 0.05990, 0.05620, 0.04830, 0.03920],
    },
    "boral": {
        "name": "Boral (Al+B₄C)",
        "density": 2.53,
        "mu_rho": [0.3600, 0.1700, 0.1200, 0.0880, 0.0790, 0.0720, 0.0650, 0.0590, 0.0575, 0.0540, 0.0467, 0.0384],
    },
}

# 선원 에너지 프리셋 [MeV]
SOURCE_PRESETS: dict[str, float] = {
    "Co-60":  1.25,   # 1.17 + 1.33 MeV 평균
    "Cs-137": 0.662,
    "Ir-192": 0.380,
    "Am-241": 0.060,
    "custom": 1.0,
}


# ---------------------------------------------------------------------------
# 내부 유틸
# ---------------------------------------------------------------------------
def _interp_mu_rho(mat_key: str, energy_MeV: float) -> float:
    """에너지 보간으로 μ/ρ 반환 [cm²/g]."""
    data = MATERIAL_DATA[mat_key]
    mu_rho_list = data["mu_rho"]
    n = min(len(_ENERGIES), len(mu_rho_list))
    return float(np.interp(energy_MeV, _ENERGIES[:n], mu_rho_list[:n]))


def _buildup_berger(mu_x: float, mat_key: str = "lead") -> float:
    """
    Berger 근사 빌드업 인수 B(μx).
    B = 1 + C × μx × exp(D × μx)
    재질별 계수는 단순화된 광자 빌드업 (Shultis & Faw 참고).
    """
    coeffs = {
        "lead":     (0.3516,  0.0450),
        "concrete": (0.6017,  0.0988),
        "water":    (0.5530,  0.0855),
        "iron":     (0.4264,  0.0626),
        "hdpe":     (0.6500,  0.1050),
        "b4c":      (0.5800,  0.0900),
        "boral":    (0.5200,  0.0800),
    }
    C, D = coeffs.get(mat_key, (0.5, 0.08))
    return 1.0 + C * mu_x * np.exp(D * mu_x)


# ---------------------------------------------------------------------------
# 공개 API
# ---------------------------------------------------------------------------
def dose_at_thickness(
    mat_key: str,
    thickness_cm: float,
    energy_MeV: float = 1.25,
    I0: float = 1.0,
    use_buildup: bool = True,
) -> float:
    """
    주어진 두께에서의 선량(또는 선속) 계산.

    Args:
        mat_key: 재질 키 ('lead', 'concrete', ...)
        thickness_cm: 두께 [cm]
        energy_MeV: 광자 에너지 [MeV]
        I0: 초기 선속 (기본 1.0)
        use_buildup: 빌드업 인수 적용 여부

    Returns:
        투과 선량 (I0 동일 단위)
    """
    mu_rho = _interp_mu_rho(mat_key, energy_MeV)
    rho = MATERIAL_DATA[mat_key]["density"]
    mu = mu_rho * rho                # 선형 감쇠 계수 [cm⁻¹]
    mu_x = mu * thickness_cm

    attenuation = I0 * np.exp(-mu_x)
    if use_buildup:
        attenuation *= _buildup_berger(mu_x, mat_key)

    return float(attenuation)


def required_thickness(
    mat_key: str,
    dose_reduction: float,
    energy_MeV: float = 1.25,
    use_buildup: bool = True,
    x_max_cm: float = 200.0,
) -> dict:
    """
    목표 선량 감소에 필요한 두께를 계산.

    Args:
        mat_key: 재질 키
        dose_reduction: 목표 투과율 (0~1, 예: 0.1 = 10% 투과 = 90% 차폐)
        energy_MeV: 광자 에너지 [MeV]
        use_buildup: 빌드업 인수 적용 여부
        x_max_cm: 탐색 최대 두께 [cm]

    Returns:
        {thickness_cm, hvl_cm, tvl_cm, attenuation_factor, mat_name}
    """
    if not 0 < dose_reduction < 1:
        raise ValueError("dose_reduction은 0 초과 1 미만이어야 합니다.")

    mu_rho = _interp_mu_rho(mat_key, energy_MeV)
    rho = MATERIAL_DATA[mat_key]["density"]
    mu = mu_rho * rho

    # HVL, TVL (빌드업 없는 기본값)
    hvl = np.log(2) / mu
    tvl = np.log(10) / mu

    if use_buildup:
        # 빌드업 있으면 수치적으로 풀기
        def objective(x):
            return dose_at_thickness(mat_key, x, energy_MeV, 1.0, True) - dose_reduction

        # 경계 확인
        if objective(0) * objective(x_max_cm) > 0:
            raise ValueError(f"x_max_cm={x_max_cm}cm 내에서 해를 찾을 수 없습니다.")

        thickness = brentq(objective, 0, x_max_cm, xtol=1e-4)
    else:
        # 해석적 해
        thickness = -np.log(dose_reduction) / mu

    return {
        "thickness_cm": round(thickness, 3),
        "hvl_cm": round(hvl, 3),
        "tvl_cm": round(tvl, 3),
        "attenuation_factor": round(1.0 / dose_reduction, 1),
        "mat_name": MATERIAL_DATA[mat_key]["name"],
        "mu_linear_cm-1": round(mu, 5),
        "used_buildup": use_buildup,
    }


def optimize_multilayer(
    materials: list[str],
    total_thickness_cm: float,
    energy_MeV: float = 1.25,
    use_buildup: bool = True,
) -> dict:
    """
    총 두께 고정, 다층 재질의 최적 두께 배분을 scipy.minimize로 계산.
    목적 함수: 총 투과 선량 최소화.

    Args:
        materials: 재질 키 리스트 (예: ['lead', 'concrete'])
        total_thickness_cm: 총 두께 제약 [cm]
        energy_MeV: 광자 에너지 [MeV]
        use_buildup: 빌드업 적용 여부

    Returns:
        {layers: [{mat, thickness_cm, dose_fraction}], total_attenuation}
    """
    n = len(materials)
    if n < 2:
        raise ValueError("재질이 2개 이상 필요합니다.")

    def total_dose(thicknesses):
        dose = 1.0
        for mat, t in zip(materials, thicknesses):
            dose *= np.exp(-_interp_mu_rho(mat, energy_MeV) * MATERIAL_DATA[mat]["density"] * t)
        if use_buildup:
            mu_x_total = sum(
                _interp_mu_rho(mat, energy_MeV) * MATERIAL_DATA[mat]["density"] * t
                for mat, t in zip(materials, thicknesses)
            )
            # 다층 빌드업: 전체 광학 두께로 근사
            first_mat = materials[0]
            dose *= _buildup_berger(mu_x_total, first_mat)
        return dose

    # 초기 추정: 균등 배분
    x0 = [total_thickness_cm / n] * n

    # 각 두께 ≥ 0, 합 = total_thickness_cm
    constraints = {"type": "eq", "fun": lambda x: sum(x) - total_thickness_cm}
    bounds = [(0, total_thickness_cm)] * n

    result = minimize(
        total_dose, x0,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"ftol": 1e-9, "maxiter": 500},
    )

    opt_thicknesses = result.x
    total_attenuation = 1.0 / total_dose(opt_thicknesses) if total_dose(opt_thicknesses) > 0 else float("inf")

    layers = [
        {
            "material": mat,
            "mat_name": MATERIAL_DATA[mat]["name"],
            "thickness_cm": round(float(t), 3),
        }
        for mat, t in zip(materials, opt_thicknesses)
    ]

    return {
        "layers": layers,
        "total_attenuation_factor": round(total_attenuation, 2),
        "total_dose_fraction": round(float(total_dose(opt_thicknesses)), 6),
        "converged": result.success,
        "message": result.message,
    }


def dose_profile(
    mat_key: str,
    energy_MeV: float = 1.25,
    x_max_cm: float = 30.0,
    n_points: int = 50,
    use_buildup: bool = True,
) -> dict:
    """
    두께에 따른 선량 프로파일 (프론트 그래프용).

    Returns:
        {x: [cm 목록], dose: [선량 목록], hvl_cm, tvl_cm}
    """
    mu_rho = _interp_mu_rho(mat_key, energy_MeV)
    rho = MATERIAL_DATA[mat_key]["density"]
    mu = mu_rho * rho

    xs = np.linspace(0, x_max_cm, n_points)
    doses = [dose_at_thickness(mat_key, float(x), energy_MeV, 1.0, use_buildup) for x in xs]

    return {
        "x_cm": [round(float(x), 2) for x in xs],
        "dose_fraction": [round(d, 6) for d in doses],
        "hvl_cm": round(np.log(2) / mu, 3),
        "tvl_cm": round(np.log(10) / mu, 3),
        "mat_name": MATERIAL_DATA[mat_key]["name"],
    }
