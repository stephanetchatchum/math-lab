# Progress

Resume here: **Milestone 1 is done and waiting for your feedback.** The next milestone is **2: Course 0 (Foundations)**. Build the topics in the order listed, one file each in `src/content/topics/foundations/`, following `src/content/topics/calculus/calc-derivative.ts`. Run `npm run verify` and `npm run e2e` before each push.

## Milestones

- [x] 1. Framework + sample topic (Calculus 1.2 The derivative)
- [ ] 2. Course 0 Foundations
- [ ] 3. Course 1 Calculus
- [ ] 4. Courses 2–3
- [ ] 5. Courses 4–5
- [ ] 6. Course 6 Numerical methods
- [ ] 7. Course 7 Physics (two halves)
- [ ] 8. Courses 8–9

## Framework (Milestone 1)

- [x] Content model, course registry, step switches per course/topic
- [x] All 13 step types
- [x] SVG scenes, animation player (Play/Step/Back/Speed, narrated captions)
- [x] Sandbox with sliders/choices/draggable points + cost/accuracy meter; canvas simulations
- [x] KaTeX bundled locally; quantity colours via \Q / \R macros
- [x] Reader engine + reader bar (line + word highlight, keyboard, double-click, quirk handling)
- [x] Pyodide worker (numpy/scipy/sympy/matplotlib, timeout, restart, inline plots)
- [x] Answer checking: numeric with units, symbolic (JS then sympy), multiple choice, ordering
- [x] Progress store (localStorage), export/import, streak, spaced-repetition review
- [x] Dashboard, prerequisite map, review, compare, formula sheet, glossary, settings, focus mode, 3 themes
- [x] PWA offline (core precache + Python download with progress), offline indicator
- [x] `npm run verify`, unit tests, Playwright e2e (steps, Python, audio quirks, offline, mobile)
- [ ] 3D projection component (with Calculus 1.8)
- [ ] Supabase store (deferred by agreement)

## Topics

### 0. Foundations
- [ ] `f-algebra` Numbers, algebra and equations
- [ ] `f-functions` Functions and graphs
- [ ] `f-explog` Exponentials and logarithms
- [ ] `f-trig` Trigonometry and the unit circle
- [ ] `f-units` Units, dimensions and estimation
- [ ] `f-logic` Logic, sets and proof

### 1. Calculus
- [ ] `calc-limits` Limits and continuity
- [x] `calc-derivative` The derivative — built in Milestone 1 (sample)
- [ ] `calc-rules` Differentiation rules
- [ ] `calc-applications` Applications of derivatives
- [ ] `calc-integral` The integral
- [ ] `calc-techniques` Integration techniques
- [ ] `calc-series` Sequences and series
- [ ] `calc-partials` Multivariable functions and partial derivatives
- [ ] `calc-gradient` Gradient, directional derivatives, Hessian
- [ ] `calc-multiple` Multiple integrals
- [ ] `calc-vectorcalc` Vector calculus

### 2. Linear algebra
- [ ] `la-vectors` Vectors
- [ ] `la-transformations` Matrices as transformations
- [ ] `la-systems` Solving linear systems
- [ ] `la-determinants` Determinants
- [ ] `la-spaces` Vector spaces and the four subspaces
- [ ] `la-orthogonality` Orthogonality
- [ ] `la-eigen` Eigenvalues and eigenvectors
- [ ] `la-symmetric` Symmetric and positive definite matrices
- [ ] `la-svd` Singular value decomposition
- [ ] `la-computation` Linear algebra in computation

### 3. Differential equations
- [ ] `de-intro` What a differential equation is
- [ ] `de-first` First-order ODEs
- [ ] `de-second` Second-order linear ODEs
- [ ] `de-systems` Systems of ODEs and phase portraits
- [ ] `de-nonlinear` Nonlinear dynamics
- [ ] `de-pdeintro` Introduction to PDEs
- [ ] `de-heat` The heat equation
- [ ] `de-wave` The wave equation
- [ ] `de-laplace` Laplace and Poisson equations

### 4. Probability and statistics
- [ ] `ps-basics` Probability basics
- [ ] `ps-rv` Random variables and distributions
- [ ] `ps-distributions` Key distributions
- [ ] `ps-joint` Joint distributions and correlation
- [ ] `ps-clt` Law of large numbers and the CLT
- [ ] `ps-estimation` Estimation and confidence intervals
- [ ] `ps-testing` Hypothesis testing and p-values
- [ ] `ps-regression` Regression and model fitting
- [ ] `ps-bayes` Bayesian inference
- [ ] `ps-errors` Uncertainty and error propagation

### 5. Complex numbers and Fourier analysis
- [ ] `fo-complex` Complex numbers
- [ ] `fo-phasors` Complex exponentials and phasors
- [ ] `fo-series` Fourier series
- [ ] `fo-transform` The Fourier transform
- [ ] `fo-dft` The DFT and the FFT

### 6. Numerical methods
- [ ] `nm-float` Floating-point arithmetic
- [ ] `nm-stability` Error, stability and conditioning
- [ ] `nm-roots` Root finding
- [ ] `nm-interp` Interpolation and approximation
- [ ] `nm-diff` Numerical differentiation
- [ ] `nm-quad` Numerical integration
- [ ] `nm-direct` Direct methods for linear systems
- [ ] `nm-iterative` Iterative methods for linear systems
- [ ] `nm-eigalg` Eigenvalue algorithms
- [ ] `nm-ode1` ODE solvers I
- [ ] `nm-ode2` ODE solvers II
- [ ] `nm-fdpde` Finite differences for PDEs
- [ ] `nm-fem` Finite volume and finite element ideas
- [ ] `nm-optim` Optimisation
- [ ] `nm-montecarlo` Monte Carlo methods
- [ ] `nm-vv` Verification and validation

### 7. Physics
- [ ] `ph-kinematics` Kinematics
- [ ] `ph-newton` Newton’s laws and forces
- [ ] `ph-energy` Work, energy and power
- [ ] `ph-momentum` Momentum and collisions
- [ ] `ph-rotation` Rotation
- [ ] `ph-oscillations` Oscillations
- [ ] `ph-gravity` Gravitation and orbits
- [ ] `ph-lagrange` Lagrangian and Hamiltonian mechanics
- [ ] `ph-waves` Waves
- [ ] `ph-fluids` Fluids
- [ ] `ph-thermo` Thermodynamics
- [ ] `ph-statmech` Statistical mechanics
- [ ] `ph-electrostatics` Electrostatics
- [ ] `ph-circuits` Circuits
- [ ] `ph-em` Magnetism and electromagnetism
- [ ] `ph-optics` Optics
- [ ] `ph-relativity` Special relativity
- [ ] `ph-quantum` Quantum mechanics
- [ ] `ph-continuum` Continuum mechanics

### 8. Science for modelling
- [ ] `sc-method` The scientific method and modelling cycle
- [ ] `sc-chemistry` Chemistry essentials
- [ ] `sc-kinetics` Reaction kinetics
- [ ] `sc-md` Molecular dynamics
- [ ] `sc-ecology` Population and ecology models
- [ ] `sc-epidemics` Epidemiology models
- [ ] `sc-biology` Biology essentials for modelling
- [ ] `sc-climate` Earth and climate basics
- [ ] `sc-transport` Diffusion and transport in nature
- [ ] `sc-scaling` Scale and nondimensionalisation

### 9. Capstone simulations
- [ ] `cap-projectile` Projectile with air drag
- [ ] `cap-nbody` Solar system / n-body
- [ ] `cap-heat2d` 2D heat diffusion in a plate
- [ ] `cap-membrane` Wave on a string / membrane
- [ ] `cap-sir` SIR epidemic fitted to data
- [ ] `cap-ising` Ising model
- [ ] `cap-schrodinger` Quantum particle in a box / tunnelling
- [ ] `cap-fluid` Simple fluid flow
