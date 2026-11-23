/** Run the same Python harness as the browser, in Node, for `npm run verify`. */
import path from 'node:path';
import { loadPyodide } from 'pyodide';
import { PY_HARNESS } from '../../src/py/harness';

export interface NodeRun { ok: boolean; error: string | null; tests: { name: string; ok: boolean; message: string }[] | null; images: string[] }

let inst: Awaited<ReturnType<typeof loadPyodide>> | null = null;

export async function nodePython() {
  if (!inst) {
    const indexURL = path.resolve('public/pyodide') + '/';
    inst = await loadPyodide({ indexURL, stdout: () => {}, stderr: () => {} });
    await inst.loadPackage(['numpy', 'scipy', 'sympy', 'matplotlib'], { messageCallback: () => {} });
    await inst.runPythonAsync(PY_HARNESS);
  }
  const py = inst;
  return {
    run(code: string, tests?: string): NodeRun {
      return JSON.parse(py.globals.get('mathlab_run')(code, tests ?? null));
    },
    equiv(a: string, b: string, vars: string[]): boolean | null {
      return JSON.parse(py.globals.get('mathlab_equiv')(a, b, py.toPy(vars)));
    },
    exec(code: string) {
      return py.runPython(code);
    },
  };
}
