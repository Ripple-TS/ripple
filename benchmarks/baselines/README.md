# Baselines and regression guards

Run benchmarks locally. Shared comparisons use per-operation Ripple/reference
ratios measured in the same invocation; absolute timings remain machine-specific.
Keep framework, compiler, browser, workload, and throttle metadata when comparing
ratios across runs or machines. Ratios reduce machine effects but do not remove
them, and changed competitor versions can change a ratio independently of Ripple.

The runner keeps measurements and regression references separate:

- `benchmarks/results/<suite>.json` is the latest result in the chosen result
  directory. Use `--results-dir=benchmarks/results/<run-name>` to retain a run.
- `benchmarks/baselines/local/<suite>.json` is the local reference written by
  `--record`. Override it with `--baseline-dir=<path>`.
- `ratios.json` contains reviewed same-run comparison limits for local checks.
  Recording a local baseline never overwrites these committed guards.

Saved results and logs under `benchmarks/results/` are kept in Git. Local
references under `benchmarks/baselines/local/` remain ignored. Preserve metadata
and raw samples with saved runs; absolute timings are specific to the machine and
workload. Deterministic measurements also depend on the exact build toolchain.

## Record and compare

From the repository root:

```sh
pnpm bench --record js-framework
pnpm bench --compare js-framework
pnpm bench --results-dir=benchmarks/results/run-a js-framework
pnpm bench --results-dir=benchmarks/results/run-b js-framework
node benchmarks/compare.mjs benchmarks/results/run-a benchmarks/results/run-b js-framework
```

The offline comparison reads saved files without running the benchmark again.
Missing operations, failed results, and incompatible run metadata are errors.
Timing regression checks use the imported noise tolerances: score growth over 15%,
minimum growth over 10%, and an additional 0.1 ms threshold for baselines below 1
ms. Local deterministic comparisons detect any increase.

The baseline report takes at least three successful normal run directories:

```sh
node benchmarks/report.mjs benchmarks/results/baseline-1 benchmarks/results/baseline-2 benchmarks/results/baseline-3
```

It reports operations separately, with units, run-to-run ranges, p95/RME
information, sample counts, and matching framework comparisons. A lower score is
an observation, not proof of a statistically meaningful timing improvement.

## Initial guard policy

Initial guards are seeded from three independent, correctness-verified normal runs
with different target orders. The policy is:

- Compare Ripple with Octane TSRX, Solid, and Vue Vapor wherever the matching
  operation exists.
- For timing, allow 50% headroom above the maximum observed paired ratio. Omit
  initial timing guards if either score is below 0.1 ms, the ratio range exceeds
  1.5×, or reported score/full-sample RME exceeds 20%.
- For bytes, allow 32 target bytes above each observed result when calculating the
  paired limit.
- For deterministic counts, use the maximum observed paired ratio without timing
  headroom. Zero reference values cannot form a ratio and are excluded.

These limits prevent regressions from the initial state; passing them does not
mean Ripple beats a competitor. All operations remain in correctness checks,
results, and local comparisons even if they are too small or variable for an
initial timing guard.

## Refreshing guards

Record repeated paired runs with the intended fixture and dependency versions.
Review the operation-level evidence and change individual limits with a written
reason. Do not automatically replace committed guards from the latest run or
loosen a limit just because a run was slow. Workload and toolchain changes require
new evidence; compare recorded metadata before attributing a difference to Ripple.

## Initial recording

The initial set contains **311 guards** across the 16 comparative suites, based on
three successful normal runs of all 17 suites (including the Ripple-only anchor
diagnostic). The recording toolchain used Node **24.18.0**. Benchmark execution is
local-only; there is no benchmark workflow. All guards were replayed successfully
against all three recorded datasets. The per-operation report and skipped-guard
reasons are kept with the local results; raw timing values were not imported from
Octane.

The initial metadata was corrected to label TodoMVC's
`row_class_writes_complete25` as a count. Raw values are unchanged, and the
original recording fingerprint is retained alongside the refined workload and
runner fingerprints.
