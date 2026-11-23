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
- [ ] 9. Course 10 Machine learning (added 2026-11-23 at your request)
- [ ] 10. Course 11 Learning agents and scientific ML (added 2026-11-23)

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
- [ ] Before Course 10: add `scikit-learn` to `PY_PACKAGES` in `src/py/version.ts` (Pyodide ships it; PyTorch/JAX are not available in the browser)

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
- [ ] `calc-calc-derivative` f-explog
- [ ] `calc-applications` Applications of derivatives
- [ ] `calc-integral` The integral
- [ ] `calc-techniques` Integration techniques
- [ ] `calc-calc-integral` calc-rules
- [ ] `calc-series` Sequences and series
- [ ] `calc-calc-rules` calc-integral
- [ ] `calc-partials` Multivariable functions and partial derivatives
- [ ] `calc-gradient` Gradient, directional derivatives, Hessian
- [ ] `calc-multiple` Multiple integrals
- [ ] `calc-calc-integral` calc-partials
- [ ] `calc-vectorcalc` Vector calculus
- [ ] `calc-calc-gradient` calc-multiple

### 2. Linear algebra
- [ ] `la-vectors` Vectors
- [ ] `la-transformations` Matrices as transformations
- [ ] `la-systems` Solving linear systems
- [ ] `la-determinants` Determinants
- [ ] `la-spaces` Vector spaces and the four subspaces
- [ ] `la-orthogonality` Orthogonality
- [ ] `la-eigen` Eigenvalues and eigenvectors
- [ ] `la-la-determinants` la-spaces
- [ ] `la-symmetric` Symmetric and positive definite matrices
- [ ] `la-la-eigen` la-orthogonality
- [ ] `la-svd` Singular value decomposition
- [ ] `la-computation` Linear algebra in computation

### 3. Differential equations
- [ ] `de-intro` What a differential equation is
- [ ] `de-calc-derivative` calc-integral
- [ ] `de-first` First-order ODEs
- [ ] `de-de-intro` calc-techniques
- [ ] `de-second` Second-order linear ODEs
- [ ] `de-systems` Systems of ODEs and phase portraits
- [ ] `de-de-second` la-eigen
- [ ] `de-nonlinear` Nonlinear dynamics
- [ ] `de-pdeintro` Introduction to PDEs
- [ ] `de-de-second` calc-partials
- [ ] `de-heat` The heat equation
- [ ] `de-de-pdeintro` calc-series
- [ ] `de-wave` The wave equation
- [ ] `de-laplace` Laplace and Poisson equations

### 4. Probability and statistics
- [ ] `ps-basics` Probability basics
- [ ] `ps-rv` Random variables and distributions
- [ ] `ps-ps-basics` calc-integral
- [ ] `ps-distributions` Key distributions
- [ ] `ps-joint` Joint distributions and correlation
- [ ] `ps-clt` Law of large numbers and the CLT
- [ ] `ps-estimation` Estimation and confidence intervals
- [ ] `ps-testing` Hypothesis testing and p-values
- [ ] `ps-regression` Regression and model fitting
- [ ] `ps-ps-estimation` la-orthogonality
- [ ] `ps-bayes` Bayesian inference
- [ ] `ps-errors` Uncertainty and error propagation
- [ ] `ps-ps-estimation` calc-gradient

### 5. Complex numbers and Fourier analysis
- [ ] `fo-complex` Complex numbers
- [ ] `fo-f-trig` f-explog
- [ ] `fo-phasors` Complex exponentials and phasors
- [ ] `fo-series` Fourier series
- [ ] `fo-fo-phasors` calc-integral
- [ ] `fo-transform` The Fourier transform
- [ ] `fo-dft` The DFT and the FFT
- [ ] `fo-fo-transform` la-transformations

### 6. Numerical methods
- [ ] `nm-float` Floating-point arithmetic
- [ ] `nm-stability` Error, stability and conditioning
- [ ] `nm-nm-float` calc-series
- [ ] `nm-roots` Root finding
- [ ] `nm-nm-stability` calc-applications
- [ ] `nm-interp` Interpolation and approximation
- [ ] `nm-nm-stability` la-systems
- [ ] `nm-diff` Numerical differentiation
- [ ] `nm-nm-float` calc-series
- [ ] `nm-quad` Numerical integration
- [ ] `nm-nm-interp` calc-integral
- [ ] `nm-direct` Direct methods for linear systems
- [ ] `nm-la-systems` nm-stability
- [ ] `nm-iterative` Iterative methods for linear systems
- [ ] `nm-nm-direct` la-symmetric
- [ ] `nm-eigalg` Eigenvalue algorithms
- [ ] `nm-la-eigen` nm-direct
- [ ] `nm-ode1` ODE solvers I
- [ ] `nm-de-first` calc-series
- [ ] `nm-ode2` ODE solvers II
- [ ] `nm-nm-ode1` la-eigen
- [ ] `nm-fdpde` Finite differences for PDEs
- [ ] `nm-nm-ode2` de-heat
- [ ] `nm-fem` Finite volume and finite element ideas
- [ ] `nm-nm-fdpde` la-symmetric
- [ ] `nm-optim` Optimisation
- [ ] `nm-calc-gradient` nm-roots
- [ ] `nm-montecarlo` Monte Carlo methods
- [ ] `nm-vv` Verification and validation

### 7. Physics
- [ ] `ph-kinematics` Kinematics
- [ ] `ph-calc-derivative` la-vectors
- [ ] `ph-newton` Newton’s laws and forces
- [ ] `ph-ph-kinematics` de-intro
- [ ] `ph-energy` Work, energy and power
- [ ] `ph-ph-newton` calc-integral
- [ ] `ph-momentum` Momentum and collisions
- [ ] `ph-rotation` Rotation
- [ ] `ph-oscillations` Oscillations
- [ ] `ph-ph-energy` de-second
- [ ] `ph-gravity` Gravitation and orbits
- [ ] `ph-ph-energy` ph-momentum
- [ ] `ph-lagrange` Lagrangian and Hamiltonian mechanics
- [ ] `ph-ph-oscillations` calc-gradient
- [ ] `ph-waves` Waves
- [ ] `ph-fluids` Fluids
- [ ] `ph-ph-energy` calc-vectorcalc
- [ ] `ph-thermo` Thermodynamics
- [ ] `ph-statmech` Statistical mechanics
- [ ] `ph-ph-thermo` ps-distributions
- [ ] `ph-electrostatics` Electrostatics
- [ ] `ph-circuits` Circuits
- [ ] `ph-ph-electrostatics` de-second
- [ ] `ph-em` Magnetism and electromagnetism
- [ ] `ph-ph-circuits` de-wave
- [ ] `ph-optics` Optics
- [ ] `ph-relativity` Special relativity
- [ ] `ph-quantum` Quantum mechanics
- [ ] `ph-ph-waves` la-eigen
- [ ] `ph-continuum` Continuum mechanics
- [ ] `ph-ph-fluids` la-symmetric

### 8. Science for modelling
- [ ] `sc-method` The scientific method and modelling cycle
- [ ] `sc-chemistry` Chemistry essentials
- [ ] `sc-kinetics` Reaction kinetics
- [ ] `sc-sc-chemistry` de-first
- [ ] `sc-md` Molecular dynamics
- [ ] `sc-ph-energy` nm-ode2
- [ ] `sc-ecology` Population and ecology models
- [ ] `sc-epidemics` Epidemiology models
- [ ] `sc-de-systems` nm-optim
- [ ] `sc-biology` Biology essentials for modelling
- [ ] `sc-climate` Earth and climate basics
- [ ] `sc-transport` Diffusion and transport in nature
- [ ] `sc-de-heat` ps-clt
- [ ] `sc-scaling` Scale and nondimensionalisation
- [ ] `sc-f-units` de-first

### 9. Capstone simulations
- [ ] `cap-projectile` Projectile with air drag
- [ ] `cap-nm-ode1` ph-newton
- [ ] `cap-nbody` Solar system / n-body
- [ ] `cap-nm-ode2` ph-gravity
- [ ] `cap-heat2d` 2D heat diffusion in a plate
- [ ] `cap-membrane` Wave on a string / membrane
- [ ] `cap-nm-fdpde` de-wave
- [ ] `cap-sir` SIR epidemic fitted to data
- [ ] `cap-sc-epidemics` ps-errors
- [ ] `cap-ising` Ising model
- [ ] `cap-ph-statmech` nm-montecarlo
- [ ] `cap-schrodinger` Quantum particle in a box / tunnelling
- [ ] `cap-ph-quantum` nm-eigalg
- [ ] `cap-fluid` Simple fluid flow
- [ ] `cap-ph-fluids` nm-fdpde

### 10. Machine learning
- [ ] `ml-intro` What learning from data means
- [ ] `ml-linear` Linear and logistic regression as learning
- [ ] `ml-ml-intro` nm-optim
- [ ] `ml-generalisation` Generalisation and regularisation
- [ ] `ml-classic` Classic methods
- [ ] `ml-unsupervised` Unsupervised learning
- [ ] `ml-ml-generalisation` la-svd
- [ ] `ml-nn` Neural networks from scratch
- [ ] `ml-ml-linear` calc-gradient
- [ ] `ml-backprop` Backpropagation and automatic differentiation
- [ ] `ml-training` Training deep networks
- [ ] `ml-cnn` Convolutional networks
- [ ] `ml-ml-training` fo-transform
- [ ] `ml-sequence` Sequence models and transformers
- [ ] `ml-generative` Generative models
- [ ] `ml-ml-training` ps-bayes
- [ ] `ml-probabilistic` Probabilistic machine learning
- [ ] `ml-ml-generalisation` ps-bayes
- [ ] `ml-practice` Machine learning in practice

### 11. Learning agents and scientific ML
- [ ] `ag-evolution` Evolutionary algorithms and neuroevolution
- [ ] `ag-rl` Reinforcement learning basics
- [ ] `ag-ml-intro` ps-rv
- [ ] `ag-deeprl` Deep reinforcement learning
- [ ] `ag-ag-rl` ml-training
- [ ] `ag-environments` Building learning environments
- [ ] `ag-ag-deeprl` ph-momentum
- [ ] `ag-multiagent` Multi-agent learning and emergence
- [ ] `ag-surrogates` Surrogate models for simulations
- [ ] `ag-ml-training` nm-vv
- [ ] `ag-pinns` Physics-informed neural networks
- [ ] `ag-ml-backprop` nm-fdpde
- [ ] `ag-learned-sims` Learned simulators
- [ ] `ag-cap-arena` Capstone: agents learn in your physics arena
- [ ] `ag-ag-multiagent` ag-evolution
- [ ] `ag-cap-surrogate` Capstone: a neural surrogate for heat flow
- [ ] `ag-ag-pinns` ag-learned-sims
