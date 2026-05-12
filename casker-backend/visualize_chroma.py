"""
ChromaDB 벡터 저장소 시각화 스크립트
출력: chroma_visualization.png (포스터용)
"""
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.font_manager as fm
from pathlib import Path
import chromadb

# Windows 한글 폰트 설정
_korean_fonts = ['Malgun Gothic', 'NanumGothic', 'AppleGothic', 'DejaVu Sans']
for _f in _korean_fonts:
    if fm.findfont(_f, fallback_to_default=False):
        plt.rcParams['font.family'] = _f
        break
plt.rcParams['axes.unicode_minus'] = False  # ASCII hyphen for minus signs

# ── 1. ChromaDB에서 임베딩 + 문서 로드 ──────────────────────
client = chromadb.PersistentClient(path=str(Path("chroma_db")))
col    = client.get_collection("langchain")
total  = col.count()
print(f"총 청크 수: {total}")

# 전체 데이터 가져오기
result = col.get(include=["embeddings", "documents", "metadatas"])
embeddings = np.array(result["embeddings"])   # (N, dim)
documents  = result["documents"]
metadatas  = result["metadatas"]

pages = [int(m.get("page", 0)) + 1 for m in metadatas]  # 1-indexed 페이지
print(f"임베딩 shape: {embeddings.shape}")
print(f"페이지 범위: {min(pages)} ~ {max(pages)}")

# ── 2. UMAP으로 2D 축소 ──────────────────────────────────────
from umap import UMAP
print("UMAP 차원 축소 중...")
reducer = UMAP(n_components=2, n_neighbors=15, min_dist=0.1, metric="cosine", random_state=42)
emb2d = reducer.fit_transform(embeddings)

# ── 3. 페이지 구간별 색상 분류 ───────────────────────────────
max_page = max(pages)
def page_to_section(p):
    if   p <= 100:  return 0   # 도입/개요
    elif p <= 250:  return 1   # Cell/Surface 문법
    elif p <= 450:  return 2   # Data Cards / 재질
    elif p <= 650:  return 3   # 탤리 / 분산감소
    elif p <= 850:  return 4   # 물리모델
    else:           return 5   # 부록/기타

labels     = np.array([page_to_section(p) for p in pages])
section_names = [
    "도입/개요 (1–100p)",
    "형상 정의 (101–250p)",
    "재질/데이터 카드 (251–450p)",
    "탤리/분산감소 (451–650p)",
    "물리 모델 (651–850p)",
    "부록/기타 (851p+)",
]
colors = ["#4f7fff", "#28c99a", "#f0a020", "#e04f4f", "#a060d0", "#607080"]

# ── 4. 플롯 그리기 ────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 8))
fig.patch.set_facecolor("#0d1117")
ax.set_facecolor("#090c12")

for sec in range(len(section_names)):
    mask = labels == sec
    if not mask.any():
        continue
    ax.scatter(
        emb2d[mask, 0], emb2d[mask, 1],
        c=colors[sec], s=6, alpha=0.6, linewidths=0,
        label=section_names[sec],
    )

# 범례
legend_patches = [
    mpatches.Patch(color=colors[i], label=section_names[i])
    for i in range(len(section_names))
    if (labels == i).any()
]
leg = ax.legend(
    handles=legend_patches, loc="upper right", fontsize=8,
    framealpha=0.3, facecolor="#1a2040", edgecolor="#304060",
    labelcolor="white",
)

ax.set_title(
    f"MCNP 6.3 Manual — ChromaDB Vector Space\n"
    f"(총 {total}개 청크 · UMAP 2D 투영 · cosine similarity)",
    color="white", fontsize=12, pad=12,
)
ax.tick_params(colors="#607080", labelsize=7)
ax.spines[:].set_edgecolor("#304060")
for spine in ax.spines.values():
    spine.set_alpha(0.4)
ax.set_xlabel("UMAP Dimension 1", color="#8090b0", fontsize=9)
ax.set_ylabel("UMAP Dimension 2", color="#8090b0", fontsize=9)

plt.tight_layout()
out = Path("chroma_visualization.png")
plt.savefig(out, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
print(f"저장 완료: {out.resolve()}")

# ── 5. 쿼리 예시 포인트 강조 (선택) ─────────────────────────
# 실제 쿼리 임베딩을 찍어서 "이 질문이 어디 근처를 검색했는지" 표현 가능
# (백엔드 실행 중일 때 embeddings 모듈 import 후 사용)
