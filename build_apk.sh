#!/bin/bash
set -e

echo "=== 1. Building React Frontend Bundle ==="
cd /app/applet
npm run build

echo "=== 2. Generating Android Source & Copying Assets ==="
python3 /app/applet/build_apk.py

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
BUILD_DIR="/android-build"
rm -rf "$BUILD_DIR/bin"/*
mkdir -p "$BUILD_DIR/bin"
cd $BUILD_DIR

echo "=== 3. Compiling Java Sources ==="
if which ecj > /dev/null 2>&1; then
  echo "Using ECJ compiler..."
  ecj -1.8 -proc:none -cp "$ANDROID_JAR" -d "$BUILD_DIR/bin" "$BUILD_DIR/src/com/bharatrecharge/app/MainActivity.java"
elif which javac > /dev/null 2>&1; then
  echo "Using javac compiler..."
  javac -source 1.8 -target 1.8 -cp "$ANDROID_JAR" -d "$BUILD_DIR/bin" "$BUILD_DIR/src/com/bharatrecharge/app/MainActivity.java"
else
  echo "Error: No Java compiler found!"
  exit 1
fi

echo "=== 4. Converting to Dalvik Executable (classes.dex) ==="
/usr/bin/dalvik-exchange --dex --output="$BUILD_DIR/bin/classes.dex" "$BUILD_DIR/bin"

echo "=== 5. Packaging Resources and Web Assets with aapt ==="
aapt package -f \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -A "$BUILD_DIR/assets" \
  -I "$ANDROID_JAR" \
  -F "$BUILD_DIR/bin/unaligned.apk"

echo "=== 6. Adding classes.dex to APK ==="
cd "$BUILD_DIR/bin"
aapt add unaligned.apk classes.dex

echo "=== 7. Aligning APK with zipalign ==="
zipalign -f -p 4 unaligned.apk aligned.apk

echo "=== 8. Generating Android Keystore (if not present) ==="
if [ ! -f "$BUILD_DIR/release.keystore" ]; then
  keytool -genkeypair -v \
    -keystore "$BUILD_DIR/release.keystore" \
    -alias bharat_recharge \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass bharatrecharge123 \
    -keypass bharatrecharge123 \
    -dname "CN=BharatRecharge, OU=Mobile, O=BharatRecharge, L=Mumbai, ST=Maharashtra, C=IN"
fi

echo "=== 9. Signing APK with apksigner ==="
apksigner sign \
  --ks "$BUILD_DIR/release.keystore" \
  --ks-pass pass:bharatrecharge123 \
  --key-pass pass:bharatrecharge123 \
  --out "$BUILD_DIR/bin/BharatRecharge.apk" \
  "$BUILD_DIR/bin/aligned.apk"

echo "=== 10. Verifying Signed APK ==="
apksigner verify --verbose "$BUILD_DIR/bin/BharatRecharge.apk"

echo "=== 11. Copying APK to Project Files ==="
mkdir -p /app/applet/public /app/applet/downloads
cp -v "$BUILD_DIR/bin/BharatRecharge.apk" /app/applet/BharatRecharge.apk
cp -v "$BUILD_DIR/bin/BharatRecharge.apk" /app/applet/public/BharatRecharge.apk
cp -v "$BUILD_DIR/bin/BharatRecharge.apk" /app/applet/downloads/BharatRecharge.apk

echo "=== BUILD COMPLETE! ==="
ls -lh /app/applet/public/BharatRecharge.apk
