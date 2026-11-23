import type { Course, TopicMeta } from './types';

/**
 * The full curriculum: every course and topic, with prerequisites.
 * Topics listed here but without a content file show as "coming soon" on the map.
 * Built topics are registered in registry.ts.
 */
function topics(course: string, prefix: string, list: [string, string, string, string, string[]][]): TopicMeta[] {
  return list.map(([slug, title, blurb, icon, prereqs], i) => ({
    id: `${prefix}-${slug}`,
    course,
    number: `${COURSE_NUM[course]}.${i + 1}`,
    title,
    blurb,
    icon,
    prereqs,
  }));
}

const COURSE_NUM: Record<string, number> = {
  foundations: 0, calculus: 1, linalg: 2, odes: 3, prob: 4, fourier: 5, numerics: 6, physics: 7, science: 8, capstone: 9,
};

export const COURSES: Course[] = [
  {
    id: 'foundations', number: 0, title: 'Foundations',
    blurb: 'Fill the gaps fast: algebra, functions, logs, trig, units and proof.',
    topics: topics('foundations', 'f', [
      ['algebra', 'Numbers, algebra and equations', 'Fractions, exponents, rearranging, inequalities.', '±', []],
      ['functions', 'Functions and graphs', 'Domain, range, composition, inverses, transformations.', 'ƒ', ['f-algebra']],
      ['explog', 'Exponentials and logarithms', 'Growth, decay, log scales and the number e.', 'eˣ', ['f-functions']],
      ['trig', 'Trigonometry and the unit circle', 'Radians, identities, polar coordinates.', '◷', ['f-functions']],
      ['units', 'Units, dimensions and estimation', 'SI, dimensional analysis, Fermi estimates.', '㎧', ['f-algebra']],
      ['logic', 'Logic, sets and proof', 'Implication, quantifiers, induction; reading proofs.', '∴', ['f-algebra']],
    ]),
  },
  {
    id: 'calculus', number: 1, title: 'Calculus',
    blurb: 'Change and accumulation, from limits to the big theorems of vector calculus.',
    topics: topics('calculus', 'calc', [
      ['limits', 'Limits and continuity', 'Getting as close as you like: the epsilon idea, visually.', '→', ['f-functions']],
      ['derivative', 'The derivative', 'Rate of change, tangent lines, first principles.', '∂', ['calc-limits']],
      ['rules', 'Differentiation rules', 'Product, quotient, chain; implicit differentiation.', '⛓', ['calc-derivative', 'f-explog', 'f-trig']],
      ['applications', 'Applications of derivatives', 'Optimisation, related rates, linearisation, Newton preview.', '⛰', ['calc-rules']],
      ['integral', 'The integral', 'Riemann sums, accumulation, the Fundamental Theorem.', '∫', ['calc-derivative']],
      ['techniques', 'Integration techniques', 'Substitution, by parts, partial fractions; when to go numeric.', '⚙', ['calc-integral', 'calc-rules']],
      ['series', 'Sequences and series', 'Convergence, Taylor series, error terms.', '∑', ['calc-rules', 'calc-integral']],
      ['partials', 'Multivariable functions and partial derivatives', 'Surfaces, slices and partial rates.', '⧉', ['calc-rules']],
      ['gradient', 'Gradient, directional derivatives, Hessian', 'Steepest ascent and multivariable optimisation.', '∇', ['calc-partials']],
      ['multiple', 'Multiple integrals', 'Double and triple integrals, the Jacobian.', '∬', ['calc-integral', 'calc-partials']],
      ['vectorcalc', 'Vector calculus', 'Divergence, curl, Green, Stokes and Gauss.', '∮', ['calc-gradient', 'calc-multiple', 'la-vectors']],
    ]),
  },
  {
    id: 'linalg', number: 2, title: 'Linear algebra',
    blurb: 'Vectors, matrices as transformations, eigenvalues and the SVD.',
    topics: topics('linalg', 'la', [
      ['vectors', 'Vectors', 'Arrows and lists: dot product, projection, norms.', '↗', ['f-trig']],
      ['transformations', 'Matrices as transformations', 'The grid picture; composition is multiplication.', '▦', ['la-vectors']],
      ['systems', 'Solving linear systems', 'Gaussian elimination, rank, the solution space.', '≡', ['la-transformations']],
      ['determinants', 'Determinants', 'Area and volume scaling; invertibility.', '◧', ['la-transformations']],
      ['spaces', 'Vector spaces and the four subspaces', 'Basis, dimension, column/null/row/left-null spaces.', '⊕', ['la-systems']],
      ['orthogonality', 'Orthogonality', 'Gram–Schmidt, QR and least squares.', '⟂', ['la-spaces']],
      ['eigen', 'Eigenvalues and eigenvectors', 'Directions that only stretch; diagonalisation, stability.', 'λ', ['la-determinants', 'la-spaces']],
      ['symmetric', 'Symmetric and positive definite matrices', 'Quadratic forms and energy.', '◇', ['la-eigen', 'la-orthogonality']],
      ['svd', 'Singular value decomposition', 'Rotate, stretch, rotate; low rank and PCA.', 'Σ', ['la-symmetric']],
      ['computation', 'Linear algebra in computation', 'Conditioning, sparsity, never invert.', '⌗', ['la-svd']],
    ]),
  },
  {
    id: 'odes', number: 3, title: 'Differential equations',
    blurb: 'Laws of change: ODEs, phase portraits, chaos and the classic PDEs.',
    topics: topics('odes', 'de', [
      ['intro', 'What a differential equation is', 'Modelling, direction fields, initial value problems.', '↝', ['calc-derivative', 'calc-integral']],
      ['first', 'First-order ODEs', 'Separable, linear, integrating factors; growth and cooling.', '⤴', ['de-intro', 'calc-techniques']],
      ['second', 'Second-order linear ODEs', 'Oscillators: damping, forcing, resonance.', '∿', ['de-first']],
      ['systems', 'Systems of ODEs and phase portraits', 'Linear systems via eigenvalues; predator–prey.', '⟲', ['de-second', 'la-eigen']],
      ['nonlinear', 'Nonlinear dynamics', 'Fixed points, limit cycles, bifurcations, Lorenz chaos.', '🦋', ['de-systems']],
      ['pdeintro', 'Introduction to PDEs', 'Classifying PDEs; boundary and initial conditions.', '⊞', ['de-second', 'calc-partials']],
      ['heat', 'The heat equation', 'Diffusion: derivation, separation of variables.', '♨', ['de-pdeintro', 'calc-series']],
      ['wave', 'The wave equation', 'Strings, d’Alembert, standing waves.', '〰', ['de-pdeintro']],
      ['laplace', 'Laplace and Poisson equations', 'Steady states and potentials.', '◎', ['de-heat']],
    ]),
  },
  {
    id: 'prob', number: 4, title: 'Probability and statistics',
    blurb: 'Uncertainty done properly, from Bayes to MCMC and error propagation.',
    topics: topics('prob', 'ps', [
      ['basics', 'Probability basics', 'Events, conditioning and Bayes with pictures.', '⚄', ['f-logic']],
      ['rv', 'Random variables and distributions', 'Expectation and variance.', 'X', ['ps-basics', 'calc-integral']],
      ['distributions', 'Key distributions', 'Binomial, Poisson, normal, exponential, uniform.', '⌒', ['ps-rv']],
      ['joint', 'Joint distributions and correlation', 'Covariance, independence, correlation.', '⁘', ['ps-distributions']],
      ['clt', 'Law of large numbers and the CLT', 'Averages settle; sums turn normal — live.', '⩫', ['ps-joint']],
      ['estimation', 'Estimation and confidence intervals', 'Estimators, bias, intervals.', '⊢', ['ps-clt']],
      ['testing', 'Hypothesis testing and p-values', 'What a p-value is, and is not.', 'p', ['ps-estimation']],
      ['regression', 'Regression and model fitting', 'Least squares, residuals, overfitting.', '⟋', ['ps-estimation', 'la-orthogonality']],
      ['bayes', 'Bayesian inference', 'Priors, posteriors and MCMC intuition.', '∝', ['ps-regression']],
      ['errors', 'Uncertainty and error propagation', 'How measurement and model errors flow through.', '±', ['ps-estimation', 'calc-gradient']],
    ]),
  },
  {
    id: 'fourier', number: 5, title: 'Complex numbers and Fourier analysis',
    blurb: 'Rotation, oscillation and frequency: from eⁱᶿ to the FFT.',
    topics: topics('fourier', 'fo', [
      ['complex', 'Complex numbers', 'The plane, polar form, Euler’s formula.', 'i', ['f-trig', 'f-explog']],
      ['phasors', 'Complex exponentials and phasors', 'Oscillations as rotating arrows; AC circuits.', '⟳', ['fo-complex']],
      ['series', 'Fourier series', 'Building signals from waves; Gibbs.', '⊿', ['fo-phasors', 'calc-integral']],
      ['transform', 'The Fourier transform', 'Frequency domain and the convolution theorem.', 'ℱ', ['fo-series']],
      ['dft', 'The DFT and the FFT', 'Sampling, aliasing, Nyquist, leakage.', '⫶', ['fo-transform', 'la-transformations']],
    ]),
  },
  {
    id: 'numerics', number: 6, title: 'Numerical methods',
    blurb: 'The core of computational science: accurate, stable, affordable computation.',
    topics: topics('numerics', 'nm', [
      ['float', 'Floating-point arithmetic', 'IEEE 754, machine epsilon, cancellation.', '≈', ['f-explog']],
      ['stability', 'Error, stability and conditioning', 'Truncation vs rounding, condition numbers.', '⚖', ['nm-float', 'calc-series']],
      ['roots', 'Root finding', 'Bisection, Newton, secant; convergence rates.', '⊥', ['nm-stability', 'calc-applications']],
      ['interp', 'Interpolation and approximation', 'Polynomials, Runge, splines, fits.', '⌇', ['nm-stability', 'la-systems']],
      ['diff', 'Numerical differentiation', 'Finite differences and the step-size trade-off.', 'Δ', ['nm-float', 'calc-series']],
      ['quad', 'Numerical integration', 'Trapezoid, Simpson, Gauss, adaptive.', '⨍', ['nm-interp', 'calc-integral']],
      ['direct', 'Direct methods for linear systems', 'LU, Cholesky, pivoting, cost.', 'LU', ['la-systems', 'nm-stability']],
      ['iterative', 'Iterative methods for linear systems', 'Jacobi, Gauss–Seidel, CG, preconditioning.', '↻', ['nm-direct', 'la-symmetric']],
      ['eigalg', 'Eigenvalue algorithms', 'Power, inverse and QR iteration.', 'λ̂', ['la-eigen', 'nm-direct']],
      ['ode1', 'ODE solvers I', 'Euler, Heun, RK4; local vs global error.', '⇢', ['de-first', 'calc-series']],
      ['ode2', 'ODE solvers II', 'Stability regions, stiffness, implicit, symplectic.', '⇶', ['nm-ode1', 'la-eigen']],
      ['fdpde', 'Finite differences for PDEs', 'Explicit/implicit heat, CFL, von Neumann.', '▤', ['nm-ode2', 'de-heat']],
      ['fem', 'Finite volume and finite element ideas', 'Weak form, meshes, basis functions.', '△', ['nm-fdpde', 'la-symmetric']],
      ['optim', 'Optimisation', 'Gradient descent, Newton, Lagrange, convexity.', '⛳', ['calc-gradient', 'nm-roots']],
      ['montecarlo', 'Monte Carlo methods', 'Sampling, 1/√N, variance reduction.', '⚂', ['ps-clt']],
      ['vv', 'Verification and validation', 'Convergence tests and manufactured solutions.', '✓', ['nm-fdpde']],
    ]),
  },
  {
    id: 'physics', number: 7, title: 'Physics',
    blurb: 'From kinematics to quantum mechanics, always with a simulation.',
    topics: topics('physics', 'ph', [
      ['kinematics', 'Kinematics', 'Position, velocity, acceleration as derivatives.', '➶', ['calc-derivative', 'la-vectors']],
      ['newton', 'Newton’s laws and forces', 'Free-body diagrams; F = ma as an ODE.', 'F', ['ph-kinematics', 'de-intro']],
      ['energy', 'Work, energy and power', 'Conservation and potential energy curves.', '⚡', ['ph-newton', 'calc-integral']],
      ['momentum', 'Momentum and collisions', 'Impulse, conservation, centre of mass.', '⇄', ['ph-newton']],
      ['rotation', 'Rotation', 'Torque, moment of inertia, angular momentum.', '↺', ['ph-momentum']],
      ['oscillations', 'Oscillations', 'SHM, damping, resonance, normal modes.', '∿', ['ph-energy', 'de-second']],
      ['gravity', 'Gravitation and orbits', 'Kepler, orbit simulation, n-body.', '☉', ['ph-energy', 'ph-momentum']],
      ['lagrange', 'Lagrangian and Hamiltonian mechanics', 'Action, generalised coordinates, phase space.', 'ℒ', ['ph-oscillations', 'calc-gradient']],
      ['waves', 'Waves', 'Superposition, interference, dispersion, sound.', '≋', ['de-wave']],
      ['fluids', 'Fluids', 'Pressure, Bernoulli, viscosity, Navier–Stokes.', '💧', ['ph-energy', 'calc-vectorcalc']],
      ['thermo', 'Thermodynamics', 'Laws, entropy, engines, heat transfer.', '🌡', ['ph-energy']],
      ['statmech', 'Statistical mechanics', 'Boltzmann, ideal gas, Ising with Monte Carlo.', '⁂', ['ph-thermo', 'ps-distributions']],
      ['electrostatics', 'Electrostatics', 'Coulomb, field, potential, Gauss, Poisson.', '±', ['calc-vectorcalc']],
      ['circuits', 'Circuits', 'Ohm, Kirchhoff, RC/RLC as ODEs.', 'Ω', ['ph-electrostatics', 'de-second']],
      ['em', 'Magnetism and electromagnetism', 'Lorentz force, induction, Maxwell, EM waves.', '🧲', ['ph-circuits', 'de-wave']],
      ['optics', 'Optics', 'Reflection, refraction, diffraction, interference.', '◐', ['ph-waves']],
      ['relativity', 'Special relativity', 'Time dilation, spacetime diagrams, E = mc².', 'c', ['ph-momentum']],
      ['quantum', 'Quantum mechanics', 'Wavefunction, Schrödinger, tunnelling, numerically.', 'ψ', ['ph-waves', 'la-eigen', 'fo-complex']],
      ['continuum', 'Continuum mechanics', 'Stress, strain, conservation laws as PDEs.', '⬚', ['ph-fluids', 'la-symmetric']],
    ]),
  },
  {
    id: 'science', number: 8, title: 'Science for modelling',
    blurb: 'The chemistry, biology and earth science behind real simulations.',
    topics: topics('science', 'sc', [
      ['method', 'The scientific method and modelling cycle', 'Assumptions, validation, falsifiability.', '⟳', []],
      ['chemistry', 'Chemistry essentials', 'Atoms, bonding, moles, reactions, equilibrium.', '⚗', ['f-units']],
      ['kinetics', 'Reaction kinetics', 'Rate laws, reaction ODEs, stiffness.', '⇌', ['sc-chemistry', 'de-first']],
      ['md', 'Molecular dynamics', 'Lennard-Jones, Verlet, periodic boundaries.', '⚛', ['ph-energy', 'nm-ode2']],
      ['ecology', 'Population and ecology models', 'Logistic growth, Lotka–Volterra.', '🐇', ['de-systems']],
      ['epidemics', 'Epidemiology models', 'SIR/SEIR, R₀, fitting to data.', '🦠', ['de-systems', 'nm-optim']],
      ['biology', 'Biology essentials for modelling', 'Cells, DNA, proteins; what bioinformatics computes.', '🧬', []],
      ['climate', 'Earth and climate basics', 'Energy balance, greenhouse effect, carbon cycle.', '🌍', ['ph-thermo']],
      ['transport', 'Diffusion and transport in nature', 'Random walks to diffusion; advection–diffusion.', '⇝', ['de-heat', 'ps-clt']],
      ['scaling', 'Scale and nondimensionalisation', 'Dimensionless numbers and scaling laws.', '⤢', ['f-units', 'de-first']],
    ]),
  },
  {
    id: 'capstone', number: 9, title: 'Capstone simulations',
    blurb: 'Bigger guided projects that join everything together.',
    topics: topics('capstone', 'cap', [
      ['projectile', 'Projectile with air drag', 'ODE + RK4 + fitting to data.', '🎯', ['nm-ode1', 'ph-newton', 'nm-optim']],
      ['nbody', 'Solar system / n-body', 'Symplectic integration and energy drift.', '🪐', ['nm-ode2', 'ph-gravity']],
      ['heat2d', '2D heat diffusion in a plate', 'Finite differences, stability, visualisation.', '🔥', ['nm-fdpde']],
      ['membrane', 'Wave on a string / membrane', 'Wave equation with boundaries.', '🥁', ['nm-fdpde', 'de-wave']],
      ['sir', 'SIR epidemic fitted to data', 'ODE + optimisation + uncertainty.', '📈', ['sc-epidemics', 'ps-errors']],
      ['ising', 'Ising model', 'Monte Carlo and a phase transition.', '🧊', ['ph-statmech', 'nm-montecarlo']],
      ['schrodinger', 'Quantum particle in a box / tunnelling', 'Numerical Schrödinger.', 'ψ', ['ph-quantum', 'nm-eigalg']],
      ['fluid', 'Simple fluid flow', 'Lattice Boltzmann or a stable 2D solver.', '🌊', ['ph-fluids', 'nm-fdpde']],
    ]),
  },
];

export const ALL_TOPIC_META: TopicMeta[] = COURSES.flatMap((c) => c.topics);
export const META_BY_ID: Record<string, TopicMeta> = Object.fromEntries(ALL_TOPIC_META.map((t) => [t.id, t]));
