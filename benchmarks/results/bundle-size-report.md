# Ripple benchmark baseline

Recorded from 3 independent normal runs on Intel(R) Core(TM) i9-9980HK CPU @ 2.40GHz, darwin/x64, Node v24.18.0.

Workload SHA-256: `278a9cbbb954dbd1adfb60cc5319e6fb445cb3b51e5a4c2f1ca3360bae9dca51`.
Lockfile SHA-256: `d8a6f54b31db111b3205572f828294eefbafded36d68caa8f044387a8421b29c`.

These are baseline observations before Ripple optimization. Scores below are medians of the per-run headline scores; the range shows run-to-run variation. The p95 column is the median of the per-run p95 values. RME remains a per-run diagnostic; neither is proof of a timing win. Each framework column is that framework's score relative to Ripple's (Ripple = 1): above 1 the framework is slower than Ripple, below 1 it is faster. For timings below 0.01 ms or a zero Ripple score, the column shows the framework's score minus Ripple's instead (positive means slower than Ripple). N/A means that operation has no matching competitor fixture.

## Verified environment

```json
{
  "ripple": "0.4.2",
  "@ripple-ts/vite-plugin": "0.4.2",
  "@tsrx/ripple": "0.2.1",
  "octane": "0.2.6",
  "solid-js": "2.0.0-rc.7",
  "@solidjs/web": "2.0.0-rc.7",
  "vite-plugin-solid": "3.0.0-next.26",
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

These candidates are ranked by absolute time difference from the best matching competitor, without starting performance work.


## bundle-size

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Octane TSRX | Octane JSX | Solid | Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| js_raw | bytes | 29171 [29171, 29171] | 29171 | 0.0% | 3 | 3.07× | 6.07× | 1.43× | 2.20× | preact: 25247 |
| js_gzip | bytes | 11188 [11188, 11188] | 11188 | 0.0% | 3 | 2.69× | 5.09× | 1.40× | 2.15× | preact: 9990 |
| js_brotli | bytes | 10066 [10066, 10066] | 10066 | 0.0% | 3 | 2.67× | 4.94× | 1.41× | 2.17× | preact: 9056 |
| app_raw | bytes | 7522 [7522, 7522] | 7522 | 0.0% | 3 | 0.95× | 1.12× | 0.85× | 0.87× | svelte: 5149 |
| app_gzip | bytes | 2295 [2295, 2295] | 2295 | 0.0% | 3 | 1.05× | 1.29× | 0.87× | 0.91× | solid: 1990 |
| app_brotli | bytes | 2029 [2029, 2029] | 2029 | 0.0% | 3 | 1.05× | 1.24× | 0.87× | 0.92× | solid: 1763 |
| fw_raw | bytes | 21649 [21649, 21649] | 21649 | 0.0% | 3 | 3.81× | 7.79× | 1.63× | 2.66× | preact: 19940 |
| fw_gzip | bytes | 8893 [8893, 8893] | 8893 | 0.0% | 3 | 3.12× | 6.07× | 1.54× | 2.47× | preact: 7985 |
| fw_brotli | bytes | 8037 [8037, 8037] | 8037 | 0.0% | 3 | 3.08× | 5.88× | 1.55× | 2.48× | preact: 7273 |
| todo_js_raw | bytes | 28242 [28242, 28242] | 28242 | 0.0% | 3 | 3.38× | N/A | 1.37× | 2.26× | preact: 16244 |
| todo_js_gzip | bytes | 11506 [11506, 11506] | 11506 | 0.0% | 3 | 2.82× | N/A | 1.32× | 2.12× | preact: 6841 |
| todo_js_brotli | bytes | 10323 [10323, 10323] | 10323 | 0.0% | 3 | 2.79× | N/A | 1.32× | 2.14× | preact: 6180 |
| todo_app_raw | bytes | 4293 [4293, 4293] | 4293 | 0.0% | 3 | 1.09× | N/A | 0.69× | 0.72× | preact: 2156 |
| todo_app_gzip | bytes | 1838 [1838, 1838] | 1838 | 0.0% | 3 | 1.22× | N/A | 0.70× | 0.74× | preact: 991 |
| todo_app_brotli | bytes | 1581 [1581, 1581] | 1581 | 0.0% | 3 | 1.24× | N/A | 0.71× | 0.76× | preact: 868 |
| todo_fw_raw | bytes | 23949 [23949, 23949] | 23949 | 0.0% | 3 | 3.79× | N/A | 1.49× | 2.54× | preact: 14088 |
| todo_fw_gzip | bytes | 9668 [9668, 9668] | 9668 | 0.0% | 3 | 3.12× | N/A | 1.43× | 2.38× | preact: 5850 |
| todo_fw_brotli | bytes | 8742 [8742, 8742] | 8742 | 0.0% | 3 | 3.07× | N/A | 1.44× | 2.39× | preact: 5312 |
| chat_js_raw | bytes | 28989 [28989, 28989] | 28989 | 0.0% | 3 | 3.26× | N/A | 1.40× | 2.32× | preact: 17744 |
| chat_js_gzip | bytes | 12045 [12045, 12045] | 12045 | 0.0% | 3 | 2.67× | N/A | 1.34× | 2.16× | preact: 7607 |
| chat_js_brotli | bytes | 10880 [10880, 10880] | 10880 | 0.0% | 3 | 2.64× | N/A | 1.34× | 2.17× | preact: 6886 |
| chat_app_raw | bytes | 5311 [5311, 5311] | 5311 | 0.0% | 3 | 1.12× | N/A | 0.82× | 0.86× | preact: 3898 |
| chat_app_gzip | bytes | 2428 [2428, 2428] | 2428 | 0.0% | 3 | 1.14× | N/A | 0.87× | 0.89× | preact: 1846 |
| chat_app_brotli | bytes | 2165 [2165, 2165] | 2165 | 0.0% | 3 | 1.13× | N/A | 0.87× | 0.90× | preact: 1645 |
| chat_fw_raw | bytes | 23678 [23678, 23678] | 23678 | 0.0% | 3 | 3.74× | N/A | 1.53× | 2.65× | preact: 13846 |
| chat_fw_gzip | bytes | 9617 [9617, 9617] | 9617 | 0.0% | 3 | 3.06× | N/A | 1.46× | 2.48× | preact: 5761 |
| chat_fw_brotli | bytes | 8715 [8715, 8715] | 8715 | 0.0% | 3 | 3.01× | N/A | 1.46× | 2.48× | preact: 5241 |
| weather_js_raw | bytes | 43196 [43196, 43196] | 43196 | 0.0% | 3 | 3.07× | N/A | 1.23× | N/A | preact: 29422 |
| weather_js_gzip | bytes | 16039 [16039, 16039] | 16039 | 0.0% | 3 | 2.76× | N/A | 1.21× | N/A | preact: 10641 |
| weather_js_brotli | bytes | 14261 [14261, 14261] | 14261 | 0.0% | 3 | 2.72× | N/A | 1.23× | N/A | preact: 9528 |
| weather_app_raw | bytes | 19087 [19087, 19087] | 19087 | 0.0% | 3 | 1.18× | N/A | 0.89× | N/A | inferno: 13677 |
| weather_app_gzip | bytes | 6365 [6365, 6365] | 6365 | 0.0% | 3 | 1.25× | N/A | 0.85× | N/A | inferno: 4475 |
| weather_app_brotli | bytes | 5482 [5482, 5482] | 5482 | 0.0% | 3 | 1.24× | N/A | 0.85× | N/A | inferno: 3900 |
| weather_fw_raw | bytes | 24109 [24109, 24109] | 24109 | 0.0% | 3 | 4.57× | N/A | 1.51× | N/A | preact: 14254 |
| weather_fw_gzip | bytes | 9674 [9674, 9674] | 9674 | 0.0% | 3 | 3.75× | N/A | 1.46× | N/A | preact: 5906 |
| weather_fw_brotli | bytes | 8779 [8779, 8779] | 8779 | 0.0% | 3 | 3.65× | N/A | 1.46× | N/A | preact: 5362 |
