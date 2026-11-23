/**
 * Python harness shared by the browser worker and the Node verifier, so
 * "passes in verify" means "passes in the browser".
 */
export const PY_HARNESS = String.raw`
import sys, io, os, json, base64, traceback, warnings
os.environ.setdefault('MPLBACKEND', 'Agg')
warnings.filterwarnings('ignore', message='.*non-interactive.*')
warnings.filterwarnings('ignore', message='.*non-GUI backend.*')

def _fmt(e):
    tb = e.__traceback__
    line = None
    while tb is not None:
        if tb.tb_frame.f_code.co_filename in ('<your code>', '<tests>'):
            line = (tb.tb_frame.f_code.co_filename, tb.tb_lineno)
        tb = tb.tb_next
    msg = ''.join(traceback.format_exception_only(type(e), e)).strip()
    if line:
        where = 'your code' if line[0] == '<your code>' else 'the tests'
        msg = f'{msg}\n  (line {line[1]} of {where})'
    return msg

def _figs():
    if 'matplotlib.pyplot' not in sys.modules:
        return []
    import matplotlib.pyplot as plt
    out = []
    for n in plt.get_fignums():
        fig = plt.figure(n)
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=96, bbox_inches='tight')
        out.append(base64.b64encode(buf.getvalue()).decode('ascii'))
    plt.close('all')
    return out

def _pretty(name):
    return name[5:].replace('_', ' ')

def mathlab_run(code, tests=None):
    if 'matplotlib.pyplot' in sys.modules:
        sys.modules['matplotlib.pyplot'].close('all')
    ns = {'__name__': '__main__'}
    res = {'ok': True, 'error': None, 'tests': None, 'images': []}
    try:
        exec(compile(code, '<your code>', 'exec'), ns)
    except BaseException as e:
        res['ok'] = False
        res['error'] = _fmt(e)
    if tests is not None:
        results = []
        if res['ok']:
            before = set(ns)
            try:
                exec(compile(tests, '<tests>', 'exec'), ns)
            except BaseException as e:
                results.append({'name': 'loading tests', 'ok': False, 'message': _fmt(e)})
            names = [k for k in ns if k.startswith('test_') and callable(ns[k]) and k not in before]
            for k in names:
                try:
                    ns[k]()
                    results.append({'name': _pretty(k), 'ok': True, 'message': ''})
                except AssertionError as e:
                    results.append({'name': _pretty(k), 'ok': False, 'message': str(e) or 'check failed'})
                except BaseException as e:
                    results.append({'name': _pretty(k), 'ok': False, 'message': _fmt(e)})
        else:
            results.append({'name': 'your code runs', 'ok': False, 'message': res['error']})
        res['tests'] = results
    try:
        res['images'] = _figs()
    except BaseException as e:
        res['error'] = (res['error'] or '') + '\nPlot error: ' + _fmt(e)
    return json.dumps(res)

def mathlab_equiv(a, b, names):
    import sympy as sp
    from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
    T = standard_transformations + (implicit_multiplication_application, convert_xor)
    loc = {v: sp.Symbol(v, positive=True) for v in names}
    loc.update({'e': sp.E, 'pi': sp.pi, 'ln': sp.log})
    try:
        A = parse_expr(a, local_dict=loc, transformations=T)
        B = parse_expr(b, local_dict=loc, transformations=T)
    except Exception:
        return 'null'
    d = sp.simplify(A - B)
    if d == 0:
        return 'true'
    z = d.equals(0)
    return 'true' if z else 'false'
`;
