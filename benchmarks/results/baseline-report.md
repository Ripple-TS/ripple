# Ripple benchmark baseline

Recorded from 3 independent normal runs on Intel(R) Core(TM) i9-9980HK CPU @
2.40GHz, darwin/x64, Node v24.18.0.

Workload SHA-256:
`57f55895502acec9d5c48a9b6defe353a316bd6023feec24a5e1d3d62329d394`.
Lockfile SHA-256:
`d5ccf4ee34c36a86ca23851dbf4fb8c938a4919fdac9c61ad7a0faf4d5ed4a7d`.

These are baseline observations before Ripple optimization. Scores below are
medians of the per-run headline scores; the range shows run-to-run variation. The
p95 column is the median of the per-run p95 values. RME remains a per-run
diagnostic; neither is proof of a timing win. Each ratio column is Ripple's score
divided by that framework's score, so values below 1 mean Ripple is faster. For
timings below 0.01 ms or a zero reference, the comparison shows an absolute
difference instead. N/A means that operation has no matching competitor fixture.

The `js-framework` and `js-framework-reorder` sections were re-recorded after the
first Ripple optimization pass (push-based reactivity, queued flush, keyed-list
reconciliation, selector lowering, inline template traversal) from 3 independent
normal runs on the same machine, with every fixture built by Vite's esbuild
minifier and the harness forcing layout before each timed sample. Their workload
SHA-256 is `18c03dbcd45f45c5a4cda65551bb332dc8cfbb6bdc7598c166c65ecf690f701f`,
lockfile SHA-256
`1973baec192f4d84d10041140f011076f75757761dd5fbcbb48371a4a0b1d1b1`, Ripple source
SHA-256 `6cec08f05d174b50d268ffd2d1aa415e057fe91ed8486e54752dec4016c6e551`, at
revision `9ce8414ec9863683d3a78bd07e4c89feb3266f71`. The other sections keep the
original recordings.

## Verified environment

```json
{
  "ripple": "0.3.126",
  "@ripple-ts/vite-plugin": "0.3.126",
  "@tsrx/ripple": "0.1.63",
  "octane": "0.2.4",
  "solid-js": "2.0.0-rc.3",
  "@solidjs/web": "2.0.0-rc.3",
  "vite-plugin-solid": "3.0.0-next.5",
  "vue": "3.6.0-rc.1",
  "@vue/runtime-vapor": "3.6.0-rc.1",
  "react": "19.2.7",
  "react-dom": "19.2.7",
  "preact": "10.29.8",
  "svelte": "5.56.7",
  "inferno": "9.1.0",
  "vite": "8.1.5",
  "babel-plugin-react-compiler": "1.0.0"
}
```

Re-measured js-framework and js-framework-reorder environment:

```json
{
  "ripple": "0.3.127",
  "@ripple-ts/vite-plugin": "0.3.127",
  "@tsrx/ripple": "0.1.64",
  "octane": "0.2.6",
  "solid-js": "2.0.0-rc.3",
  "@solidjs/web": "2.0.0-rc.3",
  "vite-plugin-solid": "3.0.0-next.5",
  "vue": "3.6.0-rc.1",
  "@vue/runtime-vapor": "3.6.0-rc.1",
  "react": "19.2.7",
  "react-dom": "19.2.7",
  "preact": "10.29.8",
  "svelte": "5.56.7",
  "inferno": "9.1.0",
  "vite": "8.1.5",
  "babel-plugin-react-compiler": "1.0.0"
}
```

## Largest timing gaps to investigate later

These candidates are ranked by absolute time difference from the best matching
competitor, without starting performance work.

- recursive-context / mount: Ripple 18.612 ms, inferno 6.075 ms; gap 12.537 ms.
- dbmon / mount: Ripple 23.717 ms, inferno 14.133 ms; gap 9.583 ms.
- portal-swarm / open_all: Ripple 10.550 ms, inferno 3.188 ms; gap 7.362 ms.
- portal-swarm / open_close_distinct: Ripple 10.625 ms, inferno 4.177 ms; gap 6.448 ms.
- effectful-list / remount: Ripple 42.592 ms, inferno 36.467 ms; gap 6.125 ms.
- portal-swarm / open_close_cycle: Ripple 9.600 ms, inferno 4.305 ms; gap 5.295 ms.
- uibench / tree/[2,2,2,2,2,2,2,2,2,2]/render: Ripple 10.556 ms, inferno 6.285 ms; gap 4.272 ms.
- portal-swarm / mount_closed: Ripple 8.962 ms, inferno 5.425 ms; gap 3.537 ms.
- chat-stream / switchConv: Ripple 7.220 ms, inferno 3.960 ms; gap 3.260 ms.
- signal-favoring / mount: Ripple 6.775 ms, inferno 3.838 ms; gap 2.937 ms.

## js-framework

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| run | ms | 6.340 [6.320, 6.340] | 6.700 | 8.4% | 24 | 0.83× | 0.76× | 0.96× | 0.90× | solid: 6.580 |
| replace | ms | 11.960 [11.700, 12.160] | 12.900 | 6.8% | 24 | 0.81× | 0.74× | 0.82× | 0.89× | vue-vapor: 13.400 |
| add | ms | 5.600 [5.320, 5.640] | 6.200 | 10.3% | 24 | 0.81× | 0.53× | 0.85× | 0.82× | solid: 6.580 |
| update | ms | 0.360 [0.320, 0.380] | 0.700 | 32.5% | 24 | 0.42× | 0.14× | 0.14× | 0.67× | vue-vapor: 0.540 |
| select | ms | 0.100 [0.100, 0.140] | 0.300 | 87.8% | 24 | 0.36× | 0.05× | 0.17× | 0.83× | vue-vapor: 0.120 |
| swap | ms | 0.240 [0.200, 0.300] | 0.500 | 29.3% | 24 | 0.35× | 0.09× | 0.29× | 0.48× | vue-vapor: 0.500 |
| remove | ms | 0.280 [0.240, 0.280] | 0.400 | 37.1% | 24 | 0.50× | 0.12× | 0.48× | 0.88× | vue-vapor: 0.320 |
| runlots | ms | 52.580 [52.340, 53.820] | 57.600 | 2.4% | 24 | 0.83× | 0.78× | 0.98× | 0.86× | solid: 53.400 |
| select_lots | ms | 0.120 [0.100, 0.140] | 0.200 | 87.8% | 24 | 0.43× | 0.01× | 0.02× | 0.86× | vue-vapor: 0.140 |
| clear | ms | 54.940 [54.180, 55.820] | 57 | 5.5% | 24 | 0.97× | 0.96× | 0.90× | 0.99× | vue-vapor: 55.660 |
| live_inserts_1k | count | 0 [0, 0] | 0 | 0.0% | 3 | 0.00× | 0.00× | 0.00× | 0.00× | svelte: 0 |
| fragment_commits_1k | count | 0 [0, 0] | 0 | 0.0% | 3 | Δ 0 | Δ 0 | Δ 0 | Δ 0 | octane-tsrx: 0 |
| live_inserts_10k | count | 0 [0, 0] | 0 | 0.0% | 3 | 0.00× | 0.00× | 0.00× | 0.00× | svelte: 0 |
| fragment_commits_10k | count | 0 [0, 0] | 0 | 0.0% | 3 | Δ 0 | Δ 0 | Δ 0 | Δ 0 | octane-tsrx: 0 |
| live_inserts_append_1k | count | 0 [0, 0] | 0 | 0.0% | 3 | 0.00× | 0.00× | 0.00× | 0.00× | svelte: 0 |
| fragment_commits_append_1k | count | 0 [0, 0] | 0 | 0.0% | 3 | Δ 0 | Δ 0 | Δ 0 | Δ 0 | octane-tsrx: 0 |
| live_inserts_prepend_100 | count | 0 [0, 0] | 0 | 0.0% | 3 | 0.00× | 0.00× | 0.00× | 0.00× | svelte: 0 |
| fragment_commits_prepend_100 | count | 0 [0, 0] | 0 | 0.0% | 3 | Δ 0 | Δ 0 | Δ 0 | Δ 0 | octane-tsrx: 0 |
| live_inserts_append_100 | count | 0 [0, 0] | 0 | 0.0% | 3 | 0.00× | 0.00× | 0.00× | 0.00× | svelte: 0 |
| fragment_commits_append_100 | count | 0 [0, 0] | 0 | 0.0% | 3 | Δ 0 | Δ 0 | Δ 0 | Δ 0 | octane-tsrx: 0 |
| live_inserts_middle_100 | count | 0 [0, 0] | 0 | 0.0% | 3 | 0.00× | 0.00× | 0.00× | 0.00× | svelte: 0 |
| fragment_commits_middle_100 | count | 0 [0, 0] | 0 | 0.0% | 3 | Δ 0 | Δ 0 | Δ 0 | Δ 0 | octane-tsrx: 0 |

## js-framework-reorder

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| reverse | ms | 2.930 [2.915, 2.955] | 2.950 | 2.3% | 24 | 0.92× | 0.63× | 1.00× | 0.74× | solid: 2.940 |
| shuffle | ms | 3.075 [3.045, 3.100] | 3.125 | 2.2% | 24 | 0.93× | 0.63× | 0.95× | 0.73× | solid: 3.245 |
| rotatef | ms | 0.072 [0.072, 0.073] | 0.093 | 18.7% | 24 | 0.33× | 0.05× | 0.30× | 0.04× | octane-tsrx: 0.220 |
| rotateb | ms | 0.051 [0.050, 0.053] | 0.055 | 5.7% | 24 | 0.25× | 0.04× | 0.24× | 0.14× | svelte: 0.161 |
| prepend100 | ms | 0.760 [0.740, 0.780] | 0.900 | 18.6% | 24 | 0.73× | 0.28× | 0.73× | 0.93× | vue-vapor: 0.820 |
| append100 | ms | 0.580 [0.580, 0.600] | 0.700 | 17.9% | 24 | 0.59× | 0.22× | 0.64× | 0.78× | vue-vapor: 0.740 |
| insertmid100 | ms | 0.680 [0.640, 0.700] | 0.800 | 17.7% | 24 | 0.76× | 0.25× | 0.69× | 0.87× | vue-vapor: 0.780 |
| removefirst | ms | 0.059 [0.058, 0.060] | 0.070 | 17.3% | 24 | 0.47× | 0.04× | 0.35× | 0.63× | vue-vapor: 0.093 |
| removeevery10 | ms | 0.345 [0.343, 0.358] | 0.365 | 3.5% | 24 | 0.81× | 0.34× | 0.80× | 0.57× | svelte: 0.376 |
| displace3 | ms | 0.144 [0.143, 0.144] | 0.155 | 5.8% | 24 | 0.62× | 0.09× | 0.48× | 0.25× | svelte: 0.205 |
| displace4 | ms | 0.150 [0.146, 0.152] | 0.155 | 5.5% | 24 | 0.60× | 0.09× | 0.49× | 0.26× | svelte: 0.206 |
| displace5 | ms | 0.152 [0.149, 0.160] | 0.170 | 13.6% | 24 | 0.59× | 0.09× | 0.48× | 0.26× | svelte: 0.219 |
| displace6 | ms | 0.162 [0.161, 0.164] | 0.170 | 2.1% | 24 | 0.61× | 0.10× | 0.50× | 0.28× | svelte: 0.222 |
| displace8 | ms | 0.175 [0.173, 0.178] | 0.190 | 4.1% | 24 | 0.63× | 0.10× | 0.53× | 0.30× | svelte: 0.238 |

## recursive-context

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mount | ms | 18.612 [16.738, 22.975] | 21.100 | 4.6% | 60 | 0.76× | 0.64× | 1.00× | 0.46× | inferno: 6.075 |
| update_root | ms | 1.850 [1.813, 2.138] | 2.800 | 19.3% | 60 | 0.37× | 0.36× | 0.83× | 1.35× | inferno: 1.137 |
| update_partial | ms | 0.100 [0.063, 0.112] | 0.200 | 122.6% | 60 | 0.32× | 0.25× | 0.50× | 0.89× | inferno: 0.100 |
| partial_unmount | ms | 0.063 [0.013, 0.075] | 0.200 | 236.5% | 60 | 0.33× | 0.36× | 0.31× | 0.45× | inferno: 0.088 |
| partial_remount | ms | 0.450 [0.412, 0.538] | 0.800 | 14.0% | 60 | 1.00× | 0.63× | 0.88× | 0.97× | inferno: 0.138 |
| unmount | ms | 1.150 [0.975, 1.213] | 1.800 | 58.3% | 60 | 0.67× | 0.63× | 0.72× | 0.39× | inferno: 0.250 |

## signal-favoring

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mount | ms | 6.775 [6.350, 7.488] | 7.800 | 9.4% | 60 | 0.67× | 0.61× | 1.06× | 1.01× | inferno: 3.838 |
| bump_shallow | ms | 0.001 [0.001, 0.002] | 0.006 | 99.5% | 60 | Δ -0.003 | Δ -0.036 | Δ -0.003 | Δ 0.000 | vue-vapor: 0.001 |
| bump_middle | ms | 0.001 [0.001, 0.002] | 0.006 | 69.2% | 60 | Δ -0.003 | Δ -0.019 | Δ -0.003 | Δ -0.001 | vue-vapor: 0.002 |
| bump_deep | ms | 0.001 [0.001, 0.002] | 0.006 | 115.4% | 60 | Δ -0.004 | Δ -0.005 | Δ -0.003 | Δ -0.000 | vue-vapor: 0.001 |
| bump_sweep | ms | 0.011 [0.011, 0.013] | 0.040 | 23.7% | 60 | 0.27× | 0.06× | 0.37× | 0.64× | vue-vapor: 0.017 |
| bump_sweep_batched | ms | 0.007 [0.007, 0.008] | 0.024 | 37.2% | 60 | Δ -0.025 | Δ -0.065 | Δ -0.011 | Δ -0.002 | vue-vapor: 0.010 |
| bump_sweep_reverse | ms | 0.008 [0.008, 0.009] | 0.028 | 37.2% | 60 | Δ -0.024 | Δ -0.062 | Δ -0.009 | Δ -0.004 | vue-vapor: 0.012 |
| unmount | ms | 0.087 [0.050, 0.100] | 0.300 | 154.8% | 60 | 0.50× | 0.50× | 1.00× | 1.40× | vue-vapor: 0.063 |

## news

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ssr_render | ms | 0.253 [0.239, 0.372] | 0.445 | 20.9% | 60 | 2.83× | 2.25× | 3.11× | 2.87× | svelte: 0.074 |
| hydrate | ms | 3.988 [3.588, 4.562] | 4.800 | 9.0% | 60 | 0.66× | 0.54× | 0.60× | 0.80× | inferno: 2.250 |

## todomvc

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| add100 | ms | 4.060 [4.040, 4.460] | 4.600 | 15.8% | 24 | 0.60× | N/A | 0.77× | 0.84× | vue-vapor: 4.860 |
| toggleAllOn | ms | 0.420 [0.340, 0.440] | 0.700 | 48.6% | 24 | 0.40× | N/A | 0.18× | 0.91× | vue-vapor: 0.460 |
| toggleAllOff | ms | 0.340 [0.300, 0.400] | 0.700 | 31.0% | 24 | 0.33× | N/A | 0.16× | 0.94× | vue-vapor: 0.360 |
| complete25 | ms | 1.440 [1.400, 1.500] | 1.500 | 26.2% | 24 | 0.58× | N/A | 0.64× | 1.22× | vue-vapor: 1.180 |
| filterCycle | ms | 1.480 [1.280, 1.500] | 1.600 | 8.1% | 24 | 0.70× | N/A | 0.70× | 0.74× | vue-vapor: 2.000 |
| edit10 | ms | 2.180 [1.920, 2.180] | 2.300 | 23.3% | 24 | 0.20× | N/A | 0.66× | 0.88× | vue-vapor: 2.480 |
| clearCompleted | ms | 0.440 [0.420, 0.480] | 0.600 | 32.2% | 24 | 0.76× | N/A | 0.76× | 1.00× | vue-vapor: 0.440 |
| destroy25 | ms | 1.280 [1.260, 1.280] | 1.400 | 16.5% | 24 | 0.70× | N/A | 0.74× | 0.97× | vue-vapor: 1.320 |
| row_class_writes_complete25 | count | 25 [25, 25] | 25 | 0.0% | 3 | 1.00× | N/A | Δ 25 | 1.00× | solid: 0 |
| nodes_100 | count | 727 [727, 727] | 727 | 0.0% | 3 | 1.00× | N/A | 1.00× | 1.00× | react: 623 |
| elements_100 | count | 517 [517, 517] | 517 | 0.0% | 3 | 1.00× | N/A | 1.00× | 1.00× | octane-tsrx: 517 |
| text_100 | count | 108 [108, 108] | 108 | 0.0% | 3 | 1.02× | N/A | 0.52× | 0.52× | octane-tsrx: 106 |
| comments_100 | count | 102 [102, 102] | 102 | 0.0% | 3 | 0.96× | N/A | Δ 102 | Δ 102 | react: 0 |
| empty_text_100 | count | 2 [2, 2] | 2 | 0.0% | 3 | Δ 2 | N/A | 0.02× | 0.02× | octane-tsrx: 0 |
| whitespace_text_100 | count | 0 [0, 0] | 0 | 0.0% | 3 | Δ 0 | N/A | Δ 0 | Δ 0 | octane-tsrx: 0 |

## chat-stream

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| streamFine | ms | 2.080 [2.020, 2.280] | 2.600 | 14.1% | 24 | 0.58× | N/A | 0.28× | 1.13× | vue-vapor: 1.840 |
| streamCoarse | ms | 0.900 [0.860, 0.960] | 1.200 | 16.5% | 24 | 0.58× | N/A | 0.41× | 1.10× | vue-vapor: 0.820 |
| appendHistory | ms | 2.440 [2.400, 2.740] | 2.900 | 32.1% | 24 | 1.07× | N/A | 0.65× | 1.40× | vue-vapor: 1.740 |
| switchConv | ms | 7.220 [6.860, 9.840] | 8 | 26.5% | 24 | 0.76× | N/A | 0.66× | 0.86× | inferno: 3.960 |
| type160 | ms | 1.620 [1.540, 1.960] | 2.100 | 33.1% | 24 | 0.43× | N/A | 1.08× | 1.04× | solid: 1.500 |
| nodes_conv | count | 93 [93, 93] | 93 | 0.0% | 3 | 0.89× | N/A | 1.16× | 0.82× | react: 80 |
| elements_conv | count | 55 [55, 55] | 55 | 0.0% | 3 | 1.00× | N/A | 1.00× | 1.00× | octane-tsrx: 55 |
| text_conv | count | 38 [38, 38] | 38 | 0.0% | 3 | 1.52× | N/A | 1.52× | 0.66× | octane-tsrx: 25 |
| comments_conv | count | 0 [0, 0] | 0 | 0.0% | 3 | 0.00× | N/A | Δ 0 | Δ 0 | react: 0 |
| empty_text_conv | count | 13 [13, 13] | 13 | 0.0% | 3 | Δ 13 | N/A | Δ 13 | 0.39× | octane-tsrx: 0 |
| whitespace_text_conv | count | 0 [0, 0] | 0 | 0.0% | 3 | Δ 0 | N/A | Δ 0 | Δ 0 | octane-tsrx: 0 |

## dbmon

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mount | ms | 23.717 [22.517, 27.867] | 27.800 | 5.1% | 90 | 1.27× | 1.03× | 0.43× | 1.28× | inferno: 14.133 |
| tick | ms | 7.983 [7.492, 8.775] | 9.200 | 6.3% | 90 | 0.88× | 0.86× | 0.30× | 1.12× | inferno: 6.892 |
| tick_partial | ms | 2.633 [2.458, 2.817] | 3.100 | 7.8% | 90 | 1.17× | 1.02× | 0.64× | 1.33× | vue-vapor: 1.975 |
| remount | ms | 15.817 [15.342, 20.008] | 18.700 | 6.0% | 90 | 0.91× | 0.83× | 0.42× | 1.06× | vue-vapor: 14.892 |
| sort | ms | 6.933 [6.758, 8.167] | 9.700 | 28.7% | 90 | 1.21× | 0.94× | 0.82× | 1.02× | octane-tsrx: 5.733 |
| unmount | ms | 5.558 [5.342, 6.417] | 7.200 | 20.9% | 90 | 0.99× | 0.98× | 0.77× | 1.00× | preact: 5.450 |

## uibench

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| table/[100,4]/render | ms | 0.857 [0.844, 1.162] | 0.905 | 8.7% | 30 | 0.73× | N/A | 0.29× | 0.80× | inferno: 0.558 |
| table/[100,4]/removeAll | ms | 0.112 [0.095, 0.181] | 0.179 | 33.0% | 30 | 0.62× | N/A | 0.15× | 0.69× | inferno: 0.077 |
| table/[100,4]/sort/0 | ms | 0.147 [0.128, 0.180] | 0.170 | 13.2% | 30 | 0.97× | N/A | 0.19× | 0.85× | octane-tsrx: 0.151 |
| table/[100,4]/sort/1 | ms | 0.138 [0.118, 0.166] | 0.142 | 11.8% | 30 | 0.92× | N/A | 0.16× | 0.90× | octane-tsrx: 0.150 |
| table/[100,4]/filter/32 | ms | 0.044 [0.039, 0.053] | 0.061 | 12.2% | 30 | 0.79× | N/A | 0.07× | 1.26× | vue-vapor: 0.035 |
| table/[100,4]/filter/16 | ms | 0.047 [0.041, 0.055] | 0.050 | 12.1% | 30 | 0.84× | N/A | 0.07× | 1.43× | vue-vapor: 0.033 |
| table/[100,4]/filter/8 | ms | 0.050 [0.043, 0.061] | 0.052 | 10.9% | 30 | 0.79× | N/A | 0.07× | 1.08× | vue-vapor: 0.046 |
| table/[100,4]/filter/4 | ms | 0.059 [0.051, 0.076] | 0.066 | 20.2% | 30 | 0.77× | N/A | 0.07× | 0.93× | vue-vapor: 0.064 |
| table/[100,4]/activate/32 | ms | 0.036 [0.031, 0.046] | 0.040 | 18.0% | 30 | 0.88× | N/A | 0.07× | 2.24× | vue-vapor: 0.016 |
| table/[100,4]/activate/16 | ms | 0.038 [0.037, 0.048] | 0.042 | 16.7% | 30 | 0.93× | N/A | 0.07× | 1.75× | vue-vapor: 0.022 |
| table/[100,4]/activate/8 | ms | 0.041 [0.040, 0.050] | 0.043 | 17.1% | 30 | 0.95× | N/A | 0.07× | 1.44× | vue-vapor: 0.029 |
| table/[100,4]/activate/4 | ms | 0.046 [0.045, 0.054] | 0.048 | 15.1% | 30 | 0.93× | N/A | 0.08× | 1.11× | vue-vapor: 0.042 |
| table/[50,4]/render | ms | 0.450 [0.425, 0.535] | 0.456 | 9.8% | 30 | 0.70× | N/A | 0.27× | 0.78× | inferno: 0.282 |
| table/[50,4]/removeAll | ms | 0.051 [0.044, 0.073] | 0.063 | 34.6% | 30 | 0.57× | N/A | 0.10× | 0.69× | inferno: 0.043 |
| table/[50,4]/sort/0 | ms | 0.070 [0.063, 0.085] | 0.074 | 8.0% | 30 | 0.90× | N/A | 0.14× | 1.03× | vue-vapor: 0.068 |
| table/[50,4]/sort/1 | ms | 0.065 [0.053, 0.078] | 0.068 | 13.9% | 30 | 0.96× | N/A | 0.13× | 0.97× | vue-vapor: 0.067 |
| table/[50,4]/filter/32 | ms | 0.022 [0.017, 0.025] | 0.025 | 12.3% | 30 | 0.81× | N/A | 0.06× | Δ 0.014 | vue-vapor: 0.008 |
| table/[50,4]/filter/16 | ms | 0.027 [0.023, 0.031] | 0.030 | 19.1% | 30 | 0.78× | N/A | 0.06× | 1.31× | vue-vapor: 0.021 |
| table/[50,4]/filter/8 | ms | 0.031 [0.027, 0.035] | 0.037 | 16.1% | 30 | 0.66× | N/A | 0.07× | 1.37× | vue-vapor: 0.023 |
| table/[50,4]/filter/4 | ms | 0.034 [0.030, 0.047] | 0.036 | 45.2% | 30 | 0.63× | N/A | 0.10× | 1.32× | vue-vapor: 0.026 |
| table/[50,4]/activate/32 | ms | 0.023 [0.020, 0.028] | 0.028 | 18.3% | 30 | 0.95× | N/A | 0.05× | Δ 0.014 | vue-vapor: 0.009 |
| table/[50,4]/activate/16 | ms | 0.026 [0.021, 0.031] | 0.031 | 24.3% | 30 | 1.17× | N/A | 0.06× | Δ 0.017 | vue-vapor: 0.010 |
| table/[50,4]/activate/8 | ms | 0.024 [0.024, 0.034] | 0.039 | 20.0% | 30 | 0.94× | N/A | 0.06× | 1.75× | vue-vapor: 0.014 |
| table/[50,4]/activate/4 | ms | 0.032 [0.025, 0.034] | 0.035 | 9.7% | 30 | 1.22× | N/A | 0.08× | 1.65× | vue-vapor: 0.020 |
| table/[100,2]/render | ms | 0.643 [0.604, 0.783] | 0.684 | 7.6% | 30 | 0.68× | N/A | 0.32× | 0.86× | inferno: 0.380 |
| table/[100,2]/removeAll | ms | 0.080 [0.057, 0.106] | 0.090 | 24.2% | 30 | 0.54× | N/A | 0.15× | 0.73× | inferno: 0.056 |
| table/[100,2]/sort/0 | ms | 0.119 [0.111, 0.146] | 0.123 | 16.1% | 30 | 0.85× | N/A | 0.19× | 0.95× | vue-vapor: 0.126 |
| table/[100,2]/sort/1 | ms | 0.112 [0.097, 0.129] | 0.117 | 11.9% | 30 | 0.84× | N/A | 0.17× | 0.87× | vue-vapor: 0.128 |
| table/[100,2]/filter/32 | ms | 0.032 [0.028, 0.041] | 0.035 | 15.1% | 30 | 0.61× | N/A | 0.05× | 1.00× | vue-vapor: 0.032 |
| table/[100,2]/filter/16 | ms | 0.035 [0.033, 0.042] | 0.036 | 14.7% | 30 | 0.60× | N/A | 0.08× | 1.12× | vue-vapor: 0.031 |
| table/[100,2]/filter/8 | ms | 0.037 [0.032, 0.048] | 0.045 | 13.9% | 30 | 0.56× | N/A | 0.07× | 1.02× | vue-vapor: 0.036 |
| table/[100,2]/filter/4 | ms | 0.044 [0.043, 0.056] | 0.047 | 11.5% | 30 | 0.60× | N/A | 0.08× | 0.96× | vue-vapor: 0.046 |
| table/[100,2]/activate/32 | ms | 0.025 [0.023, 0.031] | 0.034 | 20.0% | 30 | 0.75× | N/A | 0.06× | 1.73× | vue-vapor: 0.014 |
| table/[100,2]/activate/16 | ms | 0.026 [0.026, 0.031] | 0.029 | 14.4% | 30 | 0.70× | N/A | 0.06× | 1.32× | vue-vapor: 0.020 |
| table/[100,2]/activate/8 | ms | 0.031 [0.029, 0.032] | 0.033 | 10.6% | 30 | 0.69× | N/A | 0.06× | 1.35× | vue-vapor: 0.023 |
| table/[100,2]/activate/4 | ms | 0.035 [0.035, 0.041] | 0.040 | 16.2% | 30 | 0.66× | N/A | 0.08× | 1.00× | vue-vapor: 0.035 |
| table/[50,2]/render | ms | 0.327 [0.320, 0.376] | 0.357 | 10.2% | 30 | 0.65× | N/A | 0.33× | 0.76× | inferno: 0.218 |
| table/[50,2]/removeAll | ms | 0.037 [0.029, 0.051] | 0.047 | 36.1% | 30 | 0.47× | N/A | 0.13× | 0.76× | inferno: 0.030 |
| table/[50,2]/sort/0 | ms | 0.056 [0.052, 0.065] | 0.058 | 10.7% | 30 | 0.77× | N/A | 0.17× | 0.80× | vue-vapor: 0.070 |
| table/[50,2]/sort/1 | ms | 0.050 [0.044, 0.062] | 0.052 | 18.1% | 30 | 0.77× | N/A | 0.15× | 0.77× | octane-tsrx: 0.064 |
| table/[50,2]/filter/32 | ms | 0.013 [0.013, 0.018] | 0.019 | 24.3% | 30 | 0.45× | N/A | 0.05× | Δ 0.004 | vue-vapor: 0.009 |
| table/[50,2]/filter/16 | ms | 0.019 [0.018, 0.022] | 0.021 | 14.0% | 30 | 0.54× | N/A | 0.06× | 0.84× | vue-vapor: 0.022 |
| table/[50,2]/filter/8 | ms | 0.021 [0.020, 0.026] | 0.022 | 15.8% | 30 | 0.57× | N/A | 0.07× | 0.80× | vue-vapor: 0.026 |
| table/[50,2]/filter/4 | ms | 0.025 [0.023, 0.034] | 0.026 | 27.1% | 30 | 0.54× | N/A | 0.07× | 0.93× | vue-vapor: 0.027 |
| table/[50,2]/activate/32 | ms | 0.013 [0.013, 0.017] | 0.016 | 18.0% | 30 | 0.65× | N/A | 0.05× | Δ 0.004 | vue-vapor: 0.009 |
| table/[50,2]/activate/16 | ms | 0.014 [0.013, 0.018] | 0.015 | 14.3% | 30 | 0.61× | N/A | 0.06× | 1.24× | vue-vapor: 0.011 |
| table/[50,2]/activate/8 | ms | 0.015 [0.014, 0.019] | 0.018 | 18.1% | 30 | 0.59× | N/A | 0.07× | 1.02× | vue-vapor: 0.015 |
| table/[50,2]/activate/4 | ms | 0.018 [0.017, 0.022] | 0.020 | 11.4% | 30 | 0.63× | N/A | 0.08× | 0.98× | vue-vapor: 0.019 |
| anim/100/32 | ms | 0.019 [0.019, 0.027] | 0.024 | 17.9% | 30 | 1.19× | N/A | 0.17× | 1.74× | vue-vapor: 0.011 |
| anim/100/16 | ms | 0.022 [0.021, 0.028] | 0.023 | 10.8% | 30 | 0.72× | N/A | 0.18× | 1.25× | vue-vapor: 0.017 |
| anim/100/8 | ms | 0.023 [0.023, 0.033] | 0.028 | 17.8% | 30 | 0.59× | N/A | 0.17× | 1.21× | vue-vapor: 0.019 |
| anim/100/4 | ms | 0.031 [0.029, 0.041] | 0.035 | 19.5% | 30 | 0.46× | N/A | 0.21× | 1.27× | vue-vapor: 0.024 |
| tree/[500]/render | ms | 1.952 [1.740, 2.765] | 2.130 | 13.1% | 30 | 0.80× | N/A | 0.41× | 0.55× | inferno: 1.049 |
| tree/[500]/removeAll | ms | 0.361 [0.207, 0.474] | 0.436 | 42.5% | 30 | 0.56× | N/A | 0.25× | 0.51× | inferno: 0.225 |
| tree/[50,10]/render | ms | 2.261 [1.980, 2.297] | 2.600 | 10.6% | 30 | 0.78× | N/A | 0.36× | 0.51× | inferno: 1.132 |
| tree/[50,10]/removeAll | ms | 0.328 [0.258, 0.460] | 0.471 | 29.0% | 30 | 0.74× | N/A | 0.20× | 0.54× | inferno: 0.250 |
| tree/[10,50]/render | ms | 1.781 [1.643, 2.092] | 1.859 | 11.6% | 30 | 0.70× | N/A | 0.33× | 0.44× | inferno: 1.070 |
| tree/[10,50]/removeAll | ms | 0.265 [0.168, 0.372] | 0.359 | 48.4% | 30 | 0.81× | N/A | 0.18× | 0.51× | inferno: 0.191 |
| tree/[5,100]/render | ms | 1.741 [1.541, 2.163] | 1.933 | 11.2% | 30 | 0.71× | N/A | 0.34× | 0.44× | inferno: 1.046 |
| tree/[5,100]/removeAll | ms | 0.270 [0.149, 0.387] | 0.305 | 59.0% | 30 | 0.78× | N/A | 0.17× | 0.55× | inferno: 0.205 |
| tree/[2,2,2,2,2,2,2,2,2,2]/render | ms | 10.556 [9.544, 13.333] | 11.377 | 8.3% | 30 | 0.75× | N/A | 0.37× | 0.54× | inferno: 6.285 |
| tree/[2,2,2,2,2,2,2,2,2,2]/removeAll | ms | 3.446 [3.250, 4.355] | 3.908 | 8.5% | 30 | 0.81× | N/A | 0.34× | 0.69× | inferno: 3.225 |
| tree/[500]/[reverse] | ms | 0.490 [0.424, 0.585] | 0.510 | 9.5% | 30 | 0.95× | N/A | 0.25× | 0.66× | octane-tsrx: 0.515 |
| tree/[500]/[insertFirst(1)] | ms | 0.073 [0.069, 0.098] | 0.082 | 20.4% | 30 | 1.13× | N/A | 0.05× | 1.31× | vue-vapor: 0.056 |
| tree/[500]/[insertLast(1)] | ms | 0.073 [0.070, 0.092] | 0.082 | 8.9% | 30 | 1.28× | N/A | 0.04× | 1.71× | vue-vapor: 0.043 |
| tree/[500]/[removeFirst(1)] | ms | 0.070 [0.062, 0.082] | 0.079 | 10.7% | 30 | 1.17× | N/A | 0.04× | 1.39× | vue-vapor: 0.050 |
| tree/[500]/[removeLast(1)] | ms | 0.073 [0.059, 0.079] | 0.079 | 10.8% | 30 | 1.37× | N/A | 0.06× | 1.49× | vue-vapor: 0.049 |
| tree/[500]/[moveFromEndToStart(1)] | ms | 0.107 [0.096, 0.121] | 0.125 | 11.7% | 30 | 1.00× | N/A | 0.06× | 0.17× | octane-tsrx: 0.107 |
| tree/[500]/[moveFromStartToEnd(1)] | ms | 0.105 [0.087, 0.123] | 0.142 | 14.7% | 30 | 0.96× | N/A | 0.07× | 0.62× | octane-tsrx: 0.109 |
| tree/[50,10]/[reverse] | ms | 0.212 [0.184, 0.240] | 0.236 | 10.6% | 30 | 1.14× | N/A | 0.20× | 0.98× | octane-tsrx: 0.186 |
| tree/[50,10]/[insertFirst(1)] | ms | 0.054 [0.043, 0.060] | 0.061 | 14.2% | 30 | 2.42× | N/A | 0.05× | 2.89× | vue-vapor: 0.019 |
| tree/[50,10]/[insertLast(1)] | ms | 0.053 [0.048, 0.059] | 0.060 | 7.3% | 30 | 2.46× | N/A | 0.05× | 2.83× | vue-vapor: 0.019 |
| tree/[50,10]/[removeFirst(1)] | ms | 0.045 [0.041, 0.053] | 0.048 | 6.5% | 30 | 2.47× | N/A | 0.04× | 2.63× | vue-vapor: 0.017 |
| tree/[50,10]/[removeLast(1)] | ms | 0.044 [0.043, 0.056] | 0.047 | 12.7% | 30 | 2.33× | N/A | 0.05× | 2.74× | vue-vapor: 0.016 |
| tree/[50,10]/[moveFromEndToStart(1)] | ms | 0.056 [0.049, 0.069] | 0.062 | 12.8% | 30 | 2.57× | N/A | 0.06× | 0.26× | octane-tsrx: 0.022 |
| tree/[50,10]/[moveFromStartToEnd(1)] | ms | 0.053 [0.050, 0.066] | 0.060 | 13.0% | 30 | 2.53× | N/A | 0.05× | 1.60× | octane-tsrx: 0.021 |
| tree/[10,50]/[reverse] | ms | 0.135 [0.125, 0.170] | 0.144 | 10.8% | 30 | 1.07× | N/A | 0.13× | 0.97× | react: 0.110 |
| tree/[10,50]/[insertFirst(1)] | ms | 0.045 [0.040, 0.060] | 0.048 | 19.7% | 30 | 2.46× | N/A | 0.05× | 2.46× | octane-tsrx: 0.018 |
| tree/[10,50]/[insertLast(1)] | ms | 0.044 [0.041, 0.059] | 0.050 | 16.4% | 30 | 2.53× | N/A | 0.04× | 2.81× | vue-vapor: 0.016 |
| tree/[10,50]/[removeFirst(1)] | ms | 0.043 [0.041, 0.068] | 0.045 | 15.8% | 30 | 1.65× | N/A | 0.04× | 1.21× | octane-tsrx: 0.026 |
| tree/[10,50]/[removeLast(1)] | ms | 0.043 [0.039, 0.063] | 0.046 | 21.8% | 30 | 1.60× | N/A | 0.04× | 1.22× | octane-tsrx: 0.027 |
| tree/[10,50]/[moveFromEndToStart(1)] | ms | 0.048 [0.045, 0.059] | 0.052 | 6.2% | 30 | 1.98× | N/A | 0.05× | 0.36× | octane-tsrx: 0.024 |
| tree/[10,50]/[moveFromStartToEnd(1)] | ms | 0.048 [0.045, 0.059] | 0.053 | 9.7% | 30 | 1.98× | N/A | 0.05× | 1.98× | octane-tsrx: 0.024 |
| tree/[5,100]/[reverse] | ms | 0.118 [0.106, 0.158] | 0.137 | 16.3% | 30 | 1.13× | N/A | 0.12× | 1.06× | react: 0.089 |
| tree/[5,100]/[insertFirst(1)] | ms | 0.046 [0.046, 0.060] | 0.051 | 15.5% | 30 | 2.75× | N/A | 0.05× | 2.73× | octane-tsrx: 0.017 |
| tree/[5,100]/[insertLast(1)] | ms | 0.046 [0.042, 0.058] | 0.051 | 23.3% | 30 | 2.64× | N/A | 0.04× | 3.03× | vue-vapor: 0.015 |
| tree/[5,100]/[removeFirst(1)] | ms | 0.052 [0.048, 0.070] | 0.055 | 17.4% | 30 | 1.28× | N/A | 0.06× | 0.72× | octane-tsrx: 0.040 |
| tree/[5,100]/[removeLast(1)] | ms | 0.051 [0.047, 0.069] | 0.053 | 16.4% | 30 | 1.30× | N/A | 0.06× | 0.79× | octane-tsrx: 0.039 |
| tree/[5,100]/[moveFromEndToStart(1)] | ms | 0.055 [0.054, 0.071] | 0.062 | 15.6% | 30 | 1.63× | N/A | 0.05× | 0.48× | octane-tsrx: 0.034 |
| tree/[5,100]/[moveFromStartToEnd(1)] | ms | 0.056 [0.054, 0.066] | 0.063 | 12.6% | 30 | 1.67× | N/A | 0.06× | 1.66× | octane-tsrx: 0.034 |
| tree/[500]/[kivi_worst_case] | ms | 0.543 [0.422, 0.623] | 0.573 | 8.3% | 30 | 0.97× | N/A | 0.30× | 0.73× | octane-tsrx: 0.560 |
| tree/[500]/[snabbdom_worst_case] | ms | 0.123 [0.105, 0.144] | 0.139 | 13.1% | 30 | 1.10× | N/A | 0.09× | 0.69× | octane-tsrx: 0.112 |
| tree/[500]/[react_worst_case] | ms | 0.129 [0.106, 0.131] | 0.150 | 17.9% | 30 | 1.36× | N/A | 0.07× | 1.36× | octane-tsrx: 0.095 |
| tree/[500]/[virtual_dom_worst_case] | ms | 0.128 [0.105, 0.136] | 0.153 | 16.0% | 30 | 1.17× | N/A | 0.10× | 0.75× | octane-tsrx: 0.109 |
| tree/[10,10,10,10]/no_change | ms | 2.774 [2.296, 4.335] | 3.555 | 38.8% | 30 | 0.26× | N/A | 0.08× | 0.15× | inferno: 6.641 |
| tree/[2,2,2,2,2,2,2,2,2,2]/no_change | ms | 0.262 [0.211, 0.309] | 0.300 | 19.6% | 30 | 0.10× | N/A | 0.06× | 0.05× | inferno: 1.325 |
| cases | count | 96 [96, 96] | 96 | 0.0% | 3 | 1.00× | N/A | 1.00× | 1.00× | octane-tsrx: 96 |
| elements_largest | count | 23331 [23331, 23331] | 23331 | 0.0% | 3 | 1.00× | N/A | 1.00× | 1.00× | octane-tsrx: 23331 |
| identity_shared | count | 32543 [32543, 32543] | 32543 | 0.0% | 3 | 1.00× | N/A | 1.00× | 1.00× | octane-tsrx: 32543 |

## effectful-list

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mount_1k | ms | 36.083 [35.500, 41.842] | 40.200 | 4.8% | 90 | 0.92× | 0.98× | 0.97× | 0.93× | inferno: 34.625 |
| update_nodeps | ms | 0.263 [0.257, 0.278] | 0.320 | 7.7% | 90 | 0.32× | 0.17× | 17.50× | Δ 0.253 | vue-vapor: 0.009 |
| update_deps | ms | 11.922 [11.567, 12.327] | 12.830 | 4.9% | 90 | 0.97× | 0.89× | 0.96× | 0.88× | inferno: 10.621 |
| clear | ms | 3.725 [3.717, 4.092] | 4.900 | 7.6% | 90 | 0.83× | 0.77× | 0.71× | 0.56× | inferno: 2.950 |
| remount | ms | 42.592 [39.233, 42.867] | 45.100 | 7.2% | 90 | 1.00× | 0.98× | 1.09× | 0.91× | inferno: 36.467 |
| remove_100_scattered | ms | 1.508 [1.508, 1.592] | 2.200 | 11.7% | 90 | 0.55× | 0.41× | 0.58× | 0.52× | svelte: 1.175 |

## memo-wall

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mount | ms | 46.450 [46.050, 51.900] | 54.200 | 5.0% | 60 | 0.81× | 0.61× | 1.01× | 0.79× | solid: 45.987 |
| parent_rerender_equal_A | ms | 0.172 [0.170, 0.191] | 0.190 | 6.5% | 60 | Δ 0.169 | Δ 0.165 | Δ 0.170 | Δ 0.171 | vue-vapor: 0.001 |
| parent_rerender_equal_B | ms | 0.199 [0.153, 0.229] | 0.211 | 5.7% | 60 | Δ 0.196 | Δ 0.190 | Δ 0.197 | Δ 0.197 | solid: 0.001 |
| one_change_A | ms | 0.273 [0.215, 0.303] | 0.389 | 9.8% | 60 | 12.12× | 1.78× | 2.71× | 4.62× | octane-tsrx: 0.023 |
| one_change_B | ms | 0.277 [0.259, 0.280] | 0.427 | 11.1% | 60 | 0.26× | 0.24× | 2.39× | 4.24× | vue-vapor: 0.065 |
| ctx_through_wall_A | ms | 1.196 [1.129, 1.226] | 1.590 | 10.9% | 60 | 0.54× | 0.34× | 0.94× | 0.98× | vue-vapor: 1.222 |
| ctx_through_wall_B | ms | 1.189 [1.115, 1.349] | 1.580 | 8.6% | 60 | 0.56× | 0.37× | 0.82× | 0.97× | vue-vapor: 1.222 |

## portal-swarm

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mount_closed | ms | 8.962 [8.387, 9.100] | 10 | 7.6% | 60 | 0.56× | N/A | 0.49× | 0.62× | inferno: 5.425 |
| open_all | ms | 10.550 [10.225, 11.825] | 12.300 | 5.7% | 60 | 1.49× | N/A | 2.17× | 1.10× | inferno: 3.188 |
| rerender_open_A | ms | 0.064 [0.061, 0.069] | 0.080 | 12.0% | 60 | 5.67× | N/A | 4.64× | Δ 0.060 | vue-vapor: 0.004 |
| rerender_open_B | ms | 0.067 [0.056, 0.067] | 0.090 | 15.9% | 60 | 5.40× | N/A | 6.00× | Δ 0.060 | vue-vapor: 0.007 |
| rerender_open_B_stable | ms | 0.066 [0.065, 0.069] | 0.100 | 15.0% | 60 | 5.89× | N/A | 4.82× | Δ 0.060 | vue-vapor: 0.006 |
| open_close_cycle | ms | 9.600 [9.250, 11.355] | 11.740 | 7.8% | 60 | 1.06× | N/A | 1.58× | 0.95× | inferno: 4.305 |
| open_close_distinct | ms | 10.625 [10.245, 13.793] | 11.520 | 5.7% | 60 | 1.11× | N/A | 1.74× | 1.01× | inferno: 4.177 |
| dispatch_through_portal | ms | 0.005 [0.005, 0.005] | 0.006 | 7.6% | 60 | Δ -0.007 | N/A | Δ 0.003 | Δ -0.001 | solid: 0.002 |

## async-waterfall

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| init | ms | 20.750 [20.560, 21.110] | 21.700 | 3.3% | 30 | 0.75× | N/A | 0.88× | N/A | inferno: 19.790 |
| update | ms | 16.820 [16.790, 17.010] | 17.400 | 1.9% | 30 | 0.76× | N/A | 0.92× | N/A | inferno: 17.850 |

## streaming-ssr

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| shell_staggered | ms | 0.258 [0.240, 0.301] | 0.524 | 17.1% | 90 | 0.78× | N/A | 0.36× | N/A | inferno: 0.190 |
| total_staggered | ms | 50.776 [50.554, 51.143] | 52.363 | 0.9% | 90 | 0.99× | N/A | 1.00× | N/A | preact: 50.386 |
| shell_allfast | ms | 0.168 [0.146, 0.187] | 0.272 | 13.0% | 90 | 0.75× | N/A | 0.37× | N/A | inferno: 0.140 |
| total_allfast | ms | 1.643 [1.550, 1.653] | 2.239 | 24.9% | 90 | 0.96× | N/A | 1.26× | N/A | solid: 1.303 |
| shell_cpu_10 | ms | 0.160 [0.115, 0.162] | 0.224 | 10.7% | 90 | 0.82× | N/A | N/A | N/A | octane-tsrx: 0.195 |
| total_cpu_10 | ms | 0.662 [0.493, 0.678] | 0.778 | 11.2% | 90 | 1.12× | N/A | N/A | N/A | octane-tsrx: 0.593 |
| shell_cpu_100 | ms | 0.642 [0.532, 0.649] | 1.192 | 21.6% | 90 | 0.56× | N/A | N/A | N/A | octane-tsrx: 1.156 |
| total_cpu_100 | ms | 4.593 [3.931, 4.622] | 6.061 | 15.9% | 90 | 1.02× | N/A | N/A | N/A | octane-tsrx: 4.497 |
| shell_cpu_800 | ms | 3.708 [3.697, 3.735] | 5.176 | 3.7% | 90 | 0.43× | N/A | N/A | N/A | octane-tsrx: 8.530 |
| total_cpu_800 | ms | 35.211 [34.943, 35.561] | 43.679 | 3.2% | 90 | 0.99× | N/A | N/A | N/A | octane-tsrx: 35.634 |
| shell_cpu_waves_50 | ms | 0.239 [0.239, 0.241] | 0.405 | 5.0% | 90 | 0.45× | N/A | N/A | N/A | octane-tsrx: 0.535 |
| total_cpu_waves_50 | ms | 1.868 [1.865, 1.944] | 2.144 | 6.5% | 90 | 0.24× | N/A | N/A | N/A | octane-tsrx: 7.870 |

## ssr-throughput

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| news-50/render | ms | 0.146 [0.144, 0.149] | 0.171 | 1.2% | 202951 | 1.80× | N/A | 1.36× | 1.65× | octane-tsrx: 0.081 |
| news-500/render | ms | 2.511 [2.333, 2.592] | 2.920 | 2.6% | 11726 | 1.68× | N/A | 1.77× | 1.99× | vue-vapor: 1.264 |

## bundle-size

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| js_raw | bytes | 35047 [35047, 35047] | 35047 | 0.0% | 3 | 0.40× | 0.20× | 0.86× | 0.55× | preact: 25247 |
| js_gzip | bytes | 13410 [13410, 13410] | 13410 | 0.0% | 3 | 0.46× | 0.24× | 0.88× | 0.56× | preact: 9990 |
| js_brotli | bytes | 12006 [12006, 12006] | 12006 | 0.0% | 3 | 0.46× | 0.24× | 0.87× | 0.55× | preact: 9056 |
| app_raw | bytes | 7209 [7209, 7209] | 7209 | 0.0% | 3 | 1.01× | 0.85× | 1.13× | 1.10× | svelte: 5149 |
| app_gzip | bytes | 2312 [2312, 2312] | 2312 | 0.0% | 3 | 0.96× | 0.78× | 1.16× | 1.11× | solid: 1992 |
| app_brotli | bytes | 1991 [1991, 1991] | 1991 | 0.0% | 3 | 0.94× | 0.79× | 1.13× | 1.06× | solid: 1761 |
| fw_raw | bytes | 27838 [27838, 27838] | 27838 | 0.0% | 3 | 0.35× | 0.17× | 0.82× | 0.48× | preact: 19940 |
| fw_gzip | bytes | 11098 [11098, 11098] | 11098 | 0.0% | 3 | 0.41× | 0.21× | 0.84× | 0.51× | preact: 7985 |
| fw_brotli | bytes | 10015 [10015, 10015] | 10015 | 0.0% | 3 | 0.42× | 0.22× | 0.84× | 0.50× | preact: 7273 |
| todo_js_raw | bytes | 34037 [34037, 34037] | 34037 | 0.0% | 3 | 0.37× | N/A | 0.91× | 0.53× | preact: 16244 |
| todo_js_gzip | bytes | 13706 [13706, 13706] | 13706 | 0.0% | 3 | 0.43× | N/A | 0.94× | 0.56× | preact: 6841 |
| todo_js_brotli | bytes | 12269 [12269, 12269] | 12269 | 0.0% | 3 | 0.44× | N/A | 0.93× | 0.56× | preact: 6180 |
| todo_app_raw | bytes | 3715 [3715, 3715] | 3715 | 0.0% | 3 | 0.80× | N/A | 1.25× | 1.20× | preact: 2156 |
| todo_app_gzip | bytes | 1644 [1644, 1644] | 1644 | 0.0% | 3 | 0.73× | N/A | 1.27× | 1.21× | preact: 991 |
| todo_app_brotli | bytes | 1423 [1423, 1423] | 1423 | 0.0% | 3 | 0.73× | N/A | 1.27× | 1.19× | preact: 868 |
| todo_fw_raw | bytes | 30322 [30322, 30322] | 30322 | 0.0% | 3 | 0.34× | N/A | 0.88× | 0.50× | preact: 14088 |
| todo_fw_gzip | bytes | 12062 [12062, 12062] | 12062 | 0.0% | 3 | 0.41× | N/A | 0.90× | 0.52× | preact: 5850 |
| todo_fw_brotli | bytes | 10846 [10846, 10846] | 10846 | 0.0% | 3 | 0.42× | N/A | 0.90× | 0.52× | preact: 5312 |
| chat_js_raw | bytes | 33580 [33580, 33580] | 33580 | 0.0% | 3 | 0.37× | N/A | 0.86× | 0.50× | preact: 17744 |
| chat_js_gzip | bytes | 13761 [13761, 13761] | 13761 | 0.0% | 3 | 0.44× | N/A | 0.89× | 0.53× | preact: 7607 |
| chat_js_brotli | bytes | 12364 [12364, 12364] | 12364 | 0.0% | 3 | 0.44× | N/A | 0.88× | 0.52× | preact: 6886 |
| chat_app_raw | bytes | 4896 [4896, 4896] | 4896 | 0.0% | 3 | 0.82× | N/A | 1.12× | 1.07× | preact: 3898 |
| chat_app_gzip | bytes | 2338 [2338, 2338] | 2338 | 0.0% | 3 | 0.84× | N/A | 1.11× | 1.08× | preact: 1846 |
| chat_app_brotli | bytes | 2097 [2097, 2097] | 2097 | 0.0% | 3 | 0.86× | N/A | 1.12× | 1.08× | preact: 1645 |
| chat_fw_raw | bytes | 28684 [28684, 28684] | 28684 | 0.0% | 3 | 0.33× | N/A | 0.83× | 0.46× | preact: 13846 |
| chat_fw_gzip | bytes | 11423 [11423, 11423] | 11423 | 0.0% | 3 | 0.40× | N/A | 0.85× | 0.48× | preact: 5761 |
| chat_fw_brotli | bytes | 10267 [10267, 10267] | 10267 | 0.0% | 3 | 0.40× | N/A | 0.84× | 0.47× | preact: 5241 |

## reconcile-anchors

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| direct.mount | ms | 10.640 [9.920, 12.020] | 11.700 | 7.0% | 75 | N/A | N/A | N/A | N/A | N/A |
| direct.reverse | ms | 4.530 [4.330, 5.090] | 5.100 | 5.9% | 75 | N/A | N/A | N/A | N/A | N/A |
| direct.shuffle | ms | 5.180 [5.170, 6.530] | 6.200 | 10.6% | 75 | N/A | N/A | N/A | N/A | N/A |
| wrapped.mount | ms | 17.140 [14.760, 17.710] | 18.600 | 13.7% | 75 | N/A | N/A | N/A | N/A | N/A |
| wrapped.reverse | ms | 5.580 [4.550, 6.300] | 6.100 | 8.4% | 75 | N/A | N/A | N/A | N/A | N/A |
| wrapped.shuffle | ms | 7.210 [4.990, 7.320] | 8.300 | 10.7% | 75 | N/A | N/A | N/A | N/A | N/A |
| single.mount | ms | 15.820 [14.030, 16.460] | 17.300 | 12.5% | 75 | N/A | N/A | N/A | N/A | N/A |
| single.reverse | ms | 5.070 [4.290, 6.840] | 5.800 | 13.1% | 75 | N/A | N/A | N/A | N/A | N/A |
| single.shuffle | ms | 5.840 [5.490, 8.770] | 7.100 | 10.7% | 75 | N/A | N/A | N/A | N/A | N/A |
| switch.mount | ms | 16.040 [14.550, 17.160] | 17.700 | 8.4% | 75 | N/A | N/A | N/A | N/A | N/A |
| switch.reverse | ms | 4.900 [4.280, 5.980] | 6 | 10.4% | 75 | N/A | N/A | N/A | N/A | N/A |
| switch.shuffle | ms | 5.990 [5.050, 6.810] | 6.700 | 6.0% | 75 | N/A | N/A | N/A | N/A | N/A |
