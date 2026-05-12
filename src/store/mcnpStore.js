import { create } from 'zustand';
import { MAT_DB } from '@/utils/constants';

let surfSeq = 0, cellSeq = 0, matSeq = 0;

const defaultSdef = { par: 'P', erg: '1.25', ergMode: 'preset', ergCustom: '', x: '0', y: '0', z: '0' };
const defaultKcode = { n: '10000', k: '1.0', ic: '50', it: '250' };
const defaultFmesh = { enabled: false, num: '14', par: 'p', geom: 'xyz', ox: '0', oy: '0', oz: '-100', imesh: '100', iints: '50', jmesh: '100', jints: '50', kmesh: '100', kints: '50', out: 'xdmf', factor: '' };

export const useMCNPStore = create((set, get) => ({
  // ── Tab state ──
  activeTab: 1,
  setActiveTab: (t) => set({ activeTab: t }),

  // ── App mode ──
  appMode: 'shield', // 'shield' | 'crit'
  setAppMode: (m) => set({ appMode: m }),

  // ── Title ──
  title: '',
  setTitle: (v) => set({ title: v }),

  // ── Modes ──
  modes: new Set(['N']),
  toggleParticleMode: (p) => set(s => {
    const m = new Set(s.modes);
    if (m.has(p)) { if (m.size > 1) m.delete(p); }
    else m.add(p);
    return { modes: m };
  }),

  // ── Surfaces ──
  surfaces: [],
  addSurface: (type = 'RCC') => set(s => {
    surfSeq++;
    return { surfaces: [...s.surfaces, { id: surfSeq, type, params: {} }] };
  }),
  updateSurface: (id, updates) => set(s => ({
    surfaces: s.surfaces.map(surf => surf.id === id ? { ...surf, ...updates } : surf)
  })),
  updateSurfaceParam: (id, paramKey, value) => set(s => ({
    surfaces: s.surfaces.map(surf =>
      surf.id === id ? { ...surf, params: { ...surf.params, [paramKey]: value } } : surf
    )
  })),
  removeSurface: (id) => set(s => {
    const filtered = s.surfaces.filter(surf => surf.id !== id);
    const renumbered = filtered.map((surf, i) => ({ ...surf, id: i + 1 }));
    surfSeq = renumbered.length;
    return { surfaces: renumbered };
  }),

  // ── Cells ──
  cells: [],
  addCell: (type = 'normal') => set(s => {
    cellSeq++;
    return { cells: [...s.cells, { id: cellSeq, type, mat: '', dens: '', surf: '', u: '', latType: '1', fillExpr: '' }] };
  }),
  updateCell: (id, updates) => set(s => ({
    cells: s.cells.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  removeCell: (id) => set(s => {
    const filtered = s.cells.filter(c => c.id !== id);
    const renumbered = filtered.map((c, i) => ({ ...c, id: i + 1 }));
    cellSeq = renumbered.length;
    return { cells: renumbered };
  }),
  changeCellType: (id, type) => set(s => ({
    cells: s.cells.map(c => c.id === id ? { ...c, type, mat: '', dens: '', surf: '', u: '', latType: '1', fillExpr: '' } : c)
  })),

  // ── Materials ──
  materials: [],
  addMaterial: (key) => set(s => {
    const m = MAT_DB[key] || MAT_DB.custom;
    matSeq++;
    return { materials: [...s.materials, { id: matSeq, key, name: m.name, dens: m.dens, zaid: m.zaid }] };
  }),
  removeMaterial: (id) => set(s => {
    const filtered = s.materials.filter(m => m.id !== id);
    const renumbered = filtered.map((m, i) => ({ ...m, id: i + 1 }));
    matSeq = renumbered.length;
    return { materials: renumbered };
  }),

  // ── IMP overrides (from slide panel) ──
  impOverrides: {},
  setImpOverride: (par, cellId, val) => set(s => ({
    impOverrides: { ...s.impOverrides, [par]: { ...(s.impOverrides[par] || {}), [cellId]: val } }
  })),

  // ── Source ──
  sdef: defaultSdef,
  updateSdef: (updates) => set(s => ({ sdef: { ...s.sdef, ...updates } })),
  kcode: defaultKcode,
  updateKcode: (updates) => set(s => ({ kcode: { ...s.kcode, ...updates } })),
  ksrcPoints: [{ x: '0', y: '0', z: '0' }],
  addKsrc: () => set(s => ({ ksrcPoints: [...s.ksrcPoints, { x: '0', y: '0', z: '0' }] })),
  updateKsrc: (idx, updates) => set(s => ({
    ksrcPoints: s.ksrcPoints.map((p, i) => i === idx ? { ...p, ...updates } : p)
  })),

  // ── NPS ──
  nps: '1000000',
  setNps: (v) => set({ nps: v }),

  // ── Lattice ──
  latGrid: [],
  latNx: 4,
  latNy: 4,
  paintU: 1,
  latFillRange: '0:3 0:3 0:0',
  latFillVals: '1 1 1 1\n1 1 1 1\n1 1 1 1\n1 1 1 1',
  setLatSize: (nx, ny) => set(s => {
    const grid = Array.from({ length: ny }, (_, r) =>
      Array.from({ length: nx }, (_, c) => s.latGrid[r]?.[c] ?? 1)
    );
    const hx = Math.floor(nx / 2), hy = Math.floor(ny / 2);
    const range = `-${hx}:${nx - 1 - hx} -${hy}:${ny - 1 - hy} 0:0`;
    const vals = grid.map(row => row.join(' ')).join('\n');
    return { latNx: nx, latNy: ny, latGrid: grid, latFillRange: range, latFillVals: vals };
  }),
  paintLatCell: (r, c) => set(s => {
    const grid = s.latGrid.map(row => [...row]);
    grid[r][c] = s.paintU;
    const vals = grid.map(row => row.join(' ')).join('\n');
    return { latGrid: grid, latFillVals: vals };
  }),
  setPaintU: (u) => set({ paintU: u }),
  initLatGrid: (nx, ny) => set(() => {
    const grid = Array.from({ length: ny }, () => Array(nx).fill(1));
    const hx = Math.floor(nx / 2), hy = Math.floor(ny / 2);
    return { latGrid: grid, latNx: nx, latNy: ny, latFillRange: `-${hx}:${nx - 1 - hx} -${hy}:${ny - 1 - hy} 0:0`, latFillVals: grid.map(r => r.join(' ')).join('\n') };
  }),

  // ── Tallies ──
  tallies: [],
  addTally: () => set(s => {
    const id = s.tallies.length + 1;
    return { tallies: [...s.tallies, { id, type: 'F4', par: 'N', cells: '', fm: '', eOpen: false, eBins: '', deOpen: false, de: '', df: '' }] };
  }),
  updateTally: (id, updates) => set(s => ({
    tallies: s.tallies.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  removeTally: (id) => set(s => ({ tallies: s.tallies.filter(t => t.id !== id) })),

  // ── SI/SP ──
  si1: '', sp1: '',
  setSi1: (v) => set({ si1: v }),
  setSp1: (v) => set({ sp1: v }),

  // ── FMESH ──
  fmesh: defaultFmesh,
  updateFmesh: (updates) => set(s => ({ fmesh: { ...s.fmesh, ...updates } })),

  // ── Slide panel ──
  slideOpen: false,
  slideKey: null,
  openSlide: (key) => set({ slideOpen: true, slideKey: key }),
  closeSlide: () => set({ slideOpen: false, slideKey: null }),

  // ── Bulk import from parsed MCNP code ──
  bulkLoad: ({ title, cells, surfaces, materials, modes, nps }) => set(() => {
    surfSeq = surfaces.length ? Math.max(...surfaces.map(s => s.id)) : 0;
    cellSeq = cells.length;
    matSeq = materials.length;
    return {
      title: title || '',
      cells,
      surfaces,
      materials,
      modes: modes instanceof Set ? modes : new Set(modes || ['N']),
      nps: nps || '1000000',
    };
  }),

  // ── Tab2 ──
  uploadedCode: '',
  uploadedFileName: '',
  parseResult: null,
  setUploadedFile: (name, code) => set({ uploadedFileName: name, uploadedCode: code, parseResult: null }),
  setParseResult: (r) => set({ parseResult: r }),
  clearUpload: () => set({ uploadedCode: '', uploadedFileName: '', parseResult: null }),
}));
