/** Pyodide version bundled into /public/pyodide by scripts/fetch-pyodide.mjs. Must match package.json. */
export const PYODIDE_VERSION = '0.29.5';
export const PYODIDE_CACHE = `pyodide-${PYODIDE_VERSION}`;
/** Packages every lesson may use. Their full dependency closure is bundled. */
export const PY_PACKAGES = ['numpy', 'scipy', 'sympy', 'matplotlib'] as const;
