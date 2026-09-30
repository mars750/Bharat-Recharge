import os
import sys
import struct
import zlib
import shutil

def make_png(width, height, r, g, b):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)
        for x in range(width):
            # simple rounded gradient icon
            dx = abs(x - width / 2) / (width / 2)
            dy = abs(y - height / 2) / (height / 2)
            dist = (dx*dx + dy*dy)**0.5
            if dist > 0.95:
                raw_data.extend([0, 0, 0, 0])
            else:
                raw_data.extend([r, g, b, 255])
    compressed = zlib.compress(raw_data)
    png = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += struct.pack('>I', len(ihdr)) + b'IHDR' + ihdr + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr) & 0xffffffff)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    return png

BUILD_DIR = "/android-build"
os.makedirs(f"{BUILD_DIR}/src/com/bharatrecharge/app", exist_ok=True)
os.makedirs(f"{BUILD_DIR}/res/values", exist_ok=True)
os.makedirs(f"{BUILD_DIR}/res/drawable", exist_ok=True)
os.makedirs(f"{BUILD_DIR}/bin", exist_ok=True)

# Copy web bundle to Android assets for 100% offline & mobile standalone capability
ASSETS_DIR = f"{BUILD_DIR}/assets"
if os.path.exists(ASSETS_DIR):
    shutil.rmtree(ASSETS_DIR)
os.makedirs(ASSETS_DIR, exist_ok=True)

DIST_DIR = "/app/applet/dist"
if os.path.exists(DIST_DIR):
    print(f"Bundling web app from {DIST_DIR} into APK assets...")
    for item in os.listdir(DIST_DIR):
        if item.endswith('.apk'):
            continue
        s = os.path.join(DIST_DIR, item)
        d = os.path.join(ASSETS_DIR, item)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)
else:
    print(f"WARNING: {DIST_DIR} not found, building with minimal offline page")
    with open(f"{ASSETS_DIR}/index.html", "w") as f:
        f.write("<!DOCTYPE html><html><body><h1>BharatRecharge</h1></body></html>")

# 1. AndroidManifest.xml
manifest = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.bharatrecharge.app"
    android:versionCode="2"
    android:versionName="1.1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
with open(f"{BUILD_DIR}/AndroidManifest.xml", "w") as f:
    f.write(manifest)

# 2. strings.xml
strings = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Bharat Recharge</string>
</resources>
"""
with open(f"{BUILD_DIR}/res/values/strings.xml", "w") as f:
    f.write(strings)

# 3. ic_launcher.png (Indigo brand color)
icon_png = make_png(144, 144, 79, 70, 229)
with open(f"{BUILD_DIR}/res/drawable/ic_launcher.png", "wb") as f:
    f.write(icon_png)

# 4. MainActivity.java
activity = """package com.bharatrecharge.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;

public class MainActivity extends Activity {
    private WebView mWebView;
    private ProgressBar mProgressBar;
    // Primary URL loads the embedded web bundle so it works 100% reliably on any mobile device without 404s
    private static final String APP_URL = "file:///android_asset/index.html";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        RelativeLayout layout = new RelativeLayout(this);

        mWebView = new WebView(this);
        RelativeLayout.LayoutParams webParams = new RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.MATCH_PARENT
        );
        layout.addView(mWebView, webParams);

        mProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        mProgressBar.setMax(100);
        RelativeLayout.LayoutParams progressParams = new RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            12
        );
        progressParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        layout.addView(mProgressBar, progressParams);

        setContentView(layout);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Support UPI deep links to PhonePe, Google Pay, Paytm, BHIM, etc.
                if (url.startsWith("upi://") || url.startsWith("phonepe://") || url.startsWith("paytmmp://") || url.startsWith("tez://") || url.startsWith("bhim://") || url.startsWith("whatsapp://") || url.startsWith("intent://")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        view.getContext().startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        try {
                            Intent genericIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            view.getContext().startActivity(genericIntent);
                            return true;
                        } catch (Exception ex) {
                            return false;
                        }
                    }
                }
                return false;
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                // If any network error occurs, fall back immediately to embedded app bundle
                if (failingUrl != null && !failingUrl.startsWith("file:///android_asset/")) {
                    view.loadUrl(APP_URL);
                }
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    mProgressBar.setVisibility(View.VISIBLE);
                    mProgressBar.setProgress(newProgress);
                } else {
                    mProgressBar.setVisibility(View.GONE);
                }
            }
        });

        mWebView.loadUrl(APP_URL);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
"""
with open(f"{BUILD_DIR}/src/com/bharatrecharge/app/MainActivity.java", "w") as f:
    f.write(activity)

print("Files written successfully")
