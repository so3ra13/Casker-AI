export const SURF_PARAMS = {
  RCC: ['x₀','y₀','z₀','vx','vy','vz','r'],
  RPP: ['xmin','xmax','ymin','ymax','zmin','zmax'],
  SPH: ['x₀','y₀','z₀','r'],
  CZ:  ['r'],
  PZ:  ['d'],
  PX:  ['d'],
  PY:  ['d'],
  SO:  ['r'],
  TX:  ['x₀','y₀','z₀','A','B','C'],
  SX:  ['x₀','r'],
  SY:  ['y₀','r'],
  SZ:  ['z₀','r'],
  GQ:  ['A','B','C','D','E','F','G','H','J','K'],
};

export const MAT_DB = {
  uo2:      { name:'UO₂',         dens:'-10.176', zaid:'92235.70c 0.04 92238.70c 0.96 8016.70c 2.0' },
  zircaloy: { name:'Zircaloy-4',  dens:'-6.56',   zaid:'40090.70c 0.5 40092.70c 0.11 50116.70c 0.015' },
  water:    { name:'물 (H₂O)',    dens:'-1.0',    zaid:'1001.70c 2.0 8016.70c 1.0' },
  lead:     { name:'납 (Pb)',      dens:'-11.35',  zaid:'82208.70c 0.524 82206.70c 0.241 82207.70c 0.221' },
  concrete: { name:'콘크리트',     dens:'-2.3',    zaid:'1001.70c -0.01 8016.70c -0.529 14000.60c -0.337' },
  steel:    { name:'강철 SS316',   dens:'-7.99',   zaid:'26056.70c 0.65 24052.70c 0.17 28058.70c 0.12' },
  hdpe:     { name:'HDPE',         dens:'-0.97',   zaid:'1001.70c 2.0 6012.70c 1.0' },
  boron:    { name:'붕소강',        dens:'-7.8',    zaid:'5010.70c 0.2 5011.70c 0.8 26056.70c 1.0' },
  custom:   { name:'사용자정의',   dens:'',         zaid:'' },
};

export const ICRP21 = {
  p: {
    de: '0.01 0.015 0.02 0.03 0.05 0.07 0.1 0.15 0.2 0.3 0.4 0.5 0.6 0.8 1.0 1.5 2.0 3.0 4.0 5.0 6.0 8.0 10.0',
    df: '2.78E-5 1.11E-5 5.88E-6 2.56E-6 1.56E-6 1.20E-6 1.11E-6 1.20E-6 1.47E-6 2.38E-6 3.45E-6 5.56E-6 7.69E-6 9.09E-6 1.14E-5 1.47E-5 1.79E-5 2.44E-5 3.03E-5 4.00E-5 4.76E-5 5.56E-5 6.26E-5',
  },
  n: {
    de: '1E-9 1E-8 2.5E-8 1E-7 2E-7 5E-7 1E-6 2E-6 5E-6 1E-5 2E-5 5E-5 1E-4 2E-4 5E-4 1E-3 2E-3 5E-3 0.01 0.02 0.05 0.1 0.2 0.5 1.0 2.0 5.0 10.0 20.0',
    df: '3.09E-6 3.58E-6 4.29E-6 5.26E-6 5.55E-6 5.88E-6 6.17E-6 6.46E-6 6.81E-6 7.14E-6 7.55E-6 8.33E-6 9.09E-6 1.05E-5 1.28E-5 1.67E-5 2.22E-5 3.57E-5 5.88E-5 9.09E-5 1.47E-4 2.08E-4 2.56E-4 3.45E-4 4.17E-4 5.00E-4 6.67E-4 7.69E-4 8.33E-4',
  },
};

export const SI_PRESETS = {
  co60:  { si:'H  1.0  1.17  1.33  1.5',                              sp:'0  0.5  0.5  0' },
  cs137: { si:'H  0.6  0.662  0.75',                                   sp:'0  1.0  0' },
  watt:  { si:'H  0  0.1  0.5  1.0  2.0  5.0  10.0  20.0',           sp:'-3  0.988  1.028' },
};

export const UCLS = { 1:'u1', 2:'u2', 3:'u3', 0:'u0' };

export const CELL_TYPES = [
  { value:'normal',   label:'일반' },
  { value:'lat',      label:'Lattice' },
  { value:'fill',     label:'Fill' },
  { value:'boundary', label:'경계' },
];

export const TALLY_TYPES = ['F1','F2','F4','F5','F6','F8'];
export const PARTICLE_TYPES = ['N','P','N,P'];
