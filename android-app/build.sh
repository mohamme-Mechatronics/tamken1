#!/usr/bin/env bash
# Builds the Tamken admin APK without Gradle: aapt2 -> javac -> d8 -> zipalign -> apksigner.
set -euo pipefail
cd "$(dirname "$0")"
: "${JAVA_HOME:?set JAVA_HOME to a JDK 17}"
SDK=${ANDROID_SDK:?set ANDROID_SDK to an Android SDK with build-tools 34 and platform 34}
BT=$SDK/build-tools/34.0.0
AJ=$SDK/platforms/android-34/android.jar
export PATH=$JAVA_HOME/bin:$PATH
rm -rf build && mkdir -p build/res build/classes build/dex build/gen

"$BT/aapt2" compile --dir res -o build/res/res.zip
"$BT/aapt2" link -I "$AJ" --manifest AndroidManifest.xml -A assets \
  -o build/unsigned.apk --java build/gen build/res/res.zip --auto-add-overlay

javac -encoding UTF-8 -source 1.8 -target 1.8 -bootclasspath "$AJ:$BT/core-lambda-stubs.jar" -Xlint:-options \
  -d build/classes $(find src build/gen -name '*.java')
"$BT/d8" --min-api 24 --release --lib "$AJ" --output build/dex $(find build/classes -name '*.class')

cp build/unsigned.apk build/with-dex.apk
(cd build/dex && zip -q -j ../with-dex.apk classes.dex)
"$BT/zipalign" -f -p 4 build/with-dex.apk build/aligned.apk

KS=${KEYSTORE:-tamken-release.keystore}
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -alias tamken -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "${KS_PASS:-tamken777687}" -keypass "${KS_PASS:-tamken777687}" \
    -dname "CN=Tamken, O=Tamken, C=YE" >/dev/null 2>&1
fi
"$BT/apksigner" sign --ks "$KS" --ks-key-alias tamken --ks-pass "pass:${KS_PASS:-tamken777687}" \
  --out build/Tamken-Admin.apk build/aligned.apk
"$BT/apksigner" verify --print-certs build/Tamken-Admin.apk | head -3
ls -la build/Tamken-Admin.apk
