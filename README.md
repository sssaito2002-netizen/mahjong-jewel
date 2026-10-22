# Mahjong Jewel — offline Android preview 0.4

ZIP内の元のオンライン試作品をリポジトリ直下に展開し、`offline/` に通信不要の対局を追加しました。

## 遊ぶ

ブラウザ: `node server.js` を起動し `http://localhost:3000/offline/index.html` を開く。
Android: `.github/workflows/android.yml` の実行が成功したら Actions → 対象実行 → Artifacts → `mahjong-jewel-debug-apk` をダウンロードし、ZIP内の `app-debug.apk` をインストールする。
APKはデバッグ署名の試験版です。Android 8以降。INTERNET権限はなく、HTML/JS/麻雀エンジンをAPK内に同梱。初回起動から通信不要です。

## 実装

- 人間1人対CPU3人、東風戦、25,000点開始。CPUは向聴数と有効牌を評価。
- majiang-coreによる通常役・符・点数、フリテン、ロン／ツモ、リーチ、チー／ポン／カン、ドラ／裏ドラ。
- 順位チップ +50/+25/−25/−50。点数差をチップに変換しない。同点は起家からの席順。
- 終局時に順位チップと祝儀収支を別々にlocalStorageへ累積保存。同じ対局IDは二重計上しない。成績のJSON出力。
- 55,000点以上でコールド。0点未満でトビ。和了で飛ばした相手からトビ賞10枚。
- アプリ終了時の途中対局復元は未対応。保存成績は端末内のみで、アプリデータ削除で消えます。

## Jewel暫定ルールと未実装部分

元ZIPの `public/calculator.js` は仮計算で、READMEにも正式裁定未確定と記載されています。
この版は各色5の1枚をJewelとして表示。赤ドラ1翻に加えてJewel1翻（合計2翻）、通常役なしのドラだけ和了は禁止。
祝儀は元計算式を参考に、一発・裏ドラを基本祝儀とし、ラピス=最終翻数枚、トルマリン=和了前の持ち点の百／千／万の最大数字枚、アメジスト=1枚加算後2倍とします。
ロンは放銃者から、ツモは各家から。複数ロンは各和了者ごとに計算。トビ賞は最初に0点未満へ移した和了者へ。

**白ポッチの万能ツモ、フルジュエル役満、全役解放5枚は未実装です。正式なJewel完全版ではありません。**
元ZIPにはこれらを再現する確定した裁定表がありません。正式なルール表を受け取り次第、独立した祝儀モジュールとテストを拡張できます。

## テスト・ビルド

```sh
npm test
node scripts/bundle.js
# Android SDK 35 / JDK 17 / Gradle 8.9 がある環境
 gradle -p android assembleDebug --no-daemon
```

外部npmパッケージは不要。`vendor/majiang-core` をMITライセンスで同梱しています。
`node test/offline.test.js` は通常和了、Jewel加翻、収支保存、コールド境界、フリテンとロン提示、CPU同士の8東風戦を検証します。
この作業環境にはGradle/Android SDKがなく、ブラウザ実行もソケット制限で起動できなかったため、端末UIとAPK動作の検証は未実施です。ビルド結果はActionsで確認してください。

元試作品の `server.js`、`game.js`、`socket.js`、既存UIとテストも残しています。オンライン機能はAndroidから使用しません。
