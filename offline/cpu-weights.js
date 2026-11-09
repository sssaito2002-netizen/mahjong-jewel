'use strict';
module.exports={
  "version": 4,
  "status": "reward_search_validated",
  "trainedUntil": "2026-10-29T20:00:00.000Z",
  "evaluationFinishedAt": "2026-10-29T20:35:01.471Z",
  "completedGames": 116592,
  "trainingGames": 102144,
  "evaluationGames": 14448,
  "minimumRequestedGames": 100000,
  "minimumMet": true,
  "selected": {
    "four-standard": "standard",
    "four-hard": "push",
    "sanma-general": "fast",
    "sanma-house": "chip"
  },
  "validation": {
    "four-standard": {
      "candidate": "standard",
      "testedCandidate": "standard",
      "metrics": {
        "n": 1808,
        "meanDifference": 0.053650442477876106,
        "ci95": [
          -0.04911790502383477,
          0.15641878997958697
        ],
        "meanRank": 2.525442477876106,
        "rankChipEV": -0.7051991150442478,
        "bonusChipEV": -0.31360619469026546,
        "totalChipEV": -1.0188053097345133,
        "baselineTotalChipEV": -1.0724557522123894,
        "pairedComponents": {
          "rankChipDifference": 0.041482300884955754,
          "bonusChipDifference": 0.012168141592920354,
          "rankDifference": -0.0011061946902654867
        }
      },
      "confidence": "no_statistically_confirmed_improvement",
      "fallback": null
    },
    "four-hard": {
      "candidate": "push",
      "testedCandidate": "push",
      "metrics": {
        "n": 1804,
        "meanDifference": 0.10144124168514412,
        "ci95": [
          -0.9854738493891143,
          1.1883563327594024
        ],
        "meanRank": 2.494456762749446,
        "rankChipEV": 0.05543237250554324,
        "bonusChipEV": -0.2394678492239468,
        "totalChipEV": -0.18403547671840353,
        "baselineTotalChipEV": -0.28547671840354766,
        "pairedComponents": {
          "rankChipDifference": 0.04988913525498891,
          "bonusChipDifference": 0.05155210643015521,
          "rankDifference": -0.004988913525498891
        }
      },
      "confidence": "no_statistically_confirmed_improvement",
      "fallback": null
    },
    "sanma-general": {
      "candidate": "fast",
      "testedCandidate": "fast",
      "metrics": {
        "n": 1804,
        "meanDifference": 0.8143015521064302,
        "ci95": [
          0.15237500459877984,
          1.4762280996140804
        ],
        "meanRank": 2.005543237250554,
        "rankChipEV": 0.03325942350332594,
        "bonusChipEV": -0.1762749445676275,
        "totalChipEV": -0.14301552106430154,
        "baselineTotalChipEV": -0.9573170731707317,
        "pairedComponents": {
          "rankChipDifference": 0.31042128603104213,
          "bonusChipDifference": 0.503880266075388,
          "rankDifference": -0.020509977827051
        }
      },
      "confidence": "paired_95_percent_model_comparison",
      "fallback": null
    },
    "sanma-house": {
      "candidate": "chip",
      "testedCandidate": "chip",
      "metrics": {
        "n": 1808,
        "meanDifference": 0.054756637168141595,
        "ci95": [
          -0.7120043283644798,
          0.821517602700763
        ],
        "meanRank": 2.023783185840708,
        "rankChipEV": -0.4756637168141593,
        "bonusChipEV": 0.5022123893805309,
        "totalChipEV": 0.02654867256637168,
        "baselineTotalChipEV": -0.02820796460176991,
        "pairedComponents": {
          "rankChipDifference": 0.022123893805309734,
          "bonusChipDifference": 0.03263274336283186,
          "rankDifference": -0.0011061946902654867
        }
      },
      "confidence": "no_statistically_confirmed_improvement",
      "fallback": null
    }
  },
  "nextPolicy": {
    "four-standard": {
      "lookaheadWeight": 35,
      "tacticalDefense": true,
      "placementEV": true
    },
    "sanma-general": {
      "lookaheadValueWeight": 0.4,
      "valueBudget": 64
    }
  },
  "nextStudy": {
    "completedGames": 26136,
    "pairs": 13068,
    "failures": 0,
    "baseline": "v1.1.0 expert",
    "finishedAt": "2026-10-29T23:22:01.387Z",
    "validation": {
      "four-standard": {
        "variant": "careful",
        "phase": "fresh_confirmation",
        "adopted": true,
        "metrics": {
          "pairs": 4096,
          "meanDifference": 1.49462890625,
          "ci95": [
            0.542436365148318,
            2.446821447351682
          ],
          "rankChipDifference": 1.4892578125,
          "bonusChipDifference": 0.00537109375,
          "latency": {
            "calls": 289022,
            "meanMs": 1.0912530916746737,
            "maxMs": 77.94938599993475,
            "buckets": [
              183088,
              70106,
              32464,
              3004,
              271,
              87,
              2,
              0,
              0,
              0
            ],
            "bounds": [
              1,
              2,
              5,
              10,
              20,
              50,
              100,
              200,
              500,
              "Infinity"
            ]
          }
        },
        "p95UpperMs": 5,
        "fallback": null
      },
      "four-hard": {
        "variant": "careful",
        "phase": "first_evaluation_rejected",
        "adopted": false,
        "metrics": {
          "pairs": 1026,
          "meanDifference": 0.28460038986354774,
          "ci95": [
            -1.4751725544092151,
            2.044373334136311
          ],
          "rankChipDifference": 0.6237816764132553,
          "bonusChipDifference": -0.3391812865497076,
          "latency": {
            "calls": 59014,
            "meanMs": 1.3429336686550868,
            "maxMs": 51.85670000000391,
            "buckets": [
              32950,
              15421,
              9112,
              1327,
              184,
              19,
              1,
              0,
              0,
              0
            ],
            "bounds": [
              1,
              2,
              5,
              10,
              20,
              50,
              100,
              200,
              500,
              "Infinity"
            ]
          }
        },
        "p95UpperMs": 5,
        "fallback": "previous expert unchanged"
      },
      "sanma-general": {
        "variant": "careful",
        "phase": "first_evaluation_rejected",
        "adopted": false,
        "metrics": {
          "pairs": 1026,
          "meanDifference": -1.0243664717348928,
          "ci95": [
            -2.013064868611685,
            -0.03566807485810053
          ],
          "rankChipDifference": -0.05847953216374269,
          "bonusChipDifference": -0.9658869395711501,
          "latency": {
            "calls": 120210,
            "meanMs": 0.6903372423674615,
            "maxMs": 32.4742870000191,
            "buckets": [
              93793,
              14877,
              9885,
              1551,
              96,
              8,
              0,
              0,
              0,
              0
            ],
            "bounds": [
              1,
              2,
              5,
              10,
              20,
              50,
              100,
              200,
              500,
              "Infinity"
            ]
          }
        },
        "p95UpperMs": 5,
        "fallback": "previous expert unchanged"
      },
      "sanma-house": {
        "variant": "forecast",
        "phase": "fresh_confirmation",
        "adopted": false,
        "metrics": {
          "pairs": 4098,
          "meanDifference": 0.16447047340165935,
          "ci95": [
            -0.3060675512270459,
            0.6350084980303646
          ],
          "rankChipDifference": 0.1268911664226452,
          "bonusChipDifference": 0.037579306979014154,
          "latency": {
            "calls": 513708,
            "meanMs": 0.7042815267682611,
            "maxMs": 56.292820999980904,
            "buckets": [
              407967,
              52314,
              44595,
              8161,
              575,
              95,
              1,
              0,
              0,
              0
            ],
            "bounds": [
              1,
              2,
              5,
              10,
              20,
              50,
              100,
              200,
              500,
              "Infinity"
            ]
          }
        },
        "p95UpperMs": 5,
        "fallback": "previous expert unchanged"
      }
    }
  },
  "rewardStudy": {
    "baseline": "v1.1.1/code31 expert",
    "completedGames": 85064,
    "pairs": 42532,
    "failures": 0,
    "trainingGames": 68924,
    "evaluationGames": 16140,
    "trainingCutoff": "2026-10-30T03:00:00.000Z",
    "finishedAt": "2026-10-30T03:45:00.224Z",
    "validation": {
      "four-standard": {
        "variant": "valueCareful",
        "adopted": false,
        "metrics": {
          "pairs": 2018,
          "meanDifference": 0.711595639246779,
          "ci95": [
            -0.26014086014798443,
            1.6833321386415425
          ],
          "rankChipDifference": 0.33448959365708625,
          "bonusChipDifference": 0.37710604558969274,
          "latency": {
            "calls": 147602,
            "meanMs": 1.662277570247229,
            "maxMs": 81.01031399983913,
            "p95UpperMs": 10,
            "buckets": [
              94845,
              20818,
              18980,
              10791,
              2020,
              147,
              1,
              0,
              0,
              0
            ],
            "bounds": [
              1,
              2,
              5,
              10,
              20,
              50,
              100,
              200,
              500,
              "Infinity"
            ]
          }
        },
        "fallback": "v1.1.1 expert unchanged"
      },
      "four-hard": {
        "variant": "valueOnly",
        "adopted": false,
        "metrics": {
          "pairs": 2018,
          "meanDifference": 0.4380574826560951,
          "ci95": [
            -0.4756245460589572,
            1.3517395113711475
          ],
          "rankChipDifference": 0.024777006937561942,
          "bonusChipDifference": 0.4132804757185332,
          "latency": {
            "calls": 115443,
            "meanMs": 3.0840493873413797,
            "maxMs": 84.14015800133348,
            "p95UpperMs": 20,
            "buckets": [
              64263,
              16020,
              12269,
              12729,
              8267,
              1822,
              73,
              0,
              0,
              0
            ],
            "bounds": [
              1,
              2,
              5,
              10,
              20,
              50,
              100,
              200,
              500,
              "Infinity"
            ]
          }
        },
        "fallback": "v1.1.1 expert unchanged"
      },
      "sanma-general": {
        "variant": "valueFast",
        "adopted": true,
        "metrics": {
          "pairs": 2018,
          "meanDifference": 0.5267591674925669,
          "ci95": [
            0.03608458538962811,
            1.0174337495955057
          ],
          "rankChipDifference": 0.19821605550049554,
          "bonusChipDifference": 0.32854311199207137,
          "latency": {
            "calls": 228493,
            "meanMs": 1.0764099754351273,
            "maxMs": 64.41747099906206,
            "p95UpperMs": 10,
            "buckets": [
              180758,
              19201,
              11307,
              13600,
              3385,
              240,
              2,
              0,
              0,
              0
            ],
            "bounds": [
              1,
              2,
              5,
              10,
              20,
              50,
              100,
              200,
              500,
              "Infinity"
            ]
          }
        },
        "fallback": null
      },
      "sanma-house": {
        "variant": "value",
        "adopted": false,
        "metrics": {
          "pairs": 2016,
          "meanDifference": -0.07589285714285714,
          "ci95": [
            -0.9603671397536105,
            0.8085814254678964
          ],
          "rankChipDifference": 0.03968253968253968,
          "bonusChipDifference": -0.11557539682539683,
          "latency": {
            "calls": 251225,
            "meanMs": 1.070879735962051,
            "maxMs": 66.00070200115442,
            "p95UpperMs": 10,
            "buckets": [
              200353,
              20120,
              11900,
              14671,
              3843,
              335,
              3,
              0,
              0,
              0
            ],
            "bounds": [
              1,
              2,
              5,
              10,
              20,
              50,
              100,
              200,
              500,
              "Infinity"
            ]
          }
        },
        "fallback": "v1.1.1 expert unchanged"
      }
    }
  }
};
