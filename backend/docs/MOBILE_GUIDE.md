# 📱 NutriPlan Mobile Guide (Android & iOS)

NutriPlan includes full native **Android** and **iOS** mobile applications powered by **Capacitor 7** and **Angular 20**.

---

## 📁 Native Project Locations

```
NutriPlanApp/
├── frontend/
│   ├── capacitor.config.ts        ← Mobile runtime configuration
│   ├── android/                   ← Native Android Studio project (Gradle / Java)
│   │   ├── app/src/main/
│   │   │   ├── AndroidManifest.xml (Network & cleartext permissions)
│   │   │   ├── java/com/nutriplan/app/MainActivity.java
│   │   │   └── res/ (Icons, styles, colors, splash)
│   │   └── build.gradle
│   └── ios/                       ← Native Xcode project (Swift / CocoaPods / SPM)
│       ├── App/
│       │   ├── App/Info.plist     (App Transport Security & Display Config)
│       │   ├── App/AppDelegate.swift
│       │   └── App/Assets.xcassets (App icons & launch screen)
│       └── App.xcodeproj
```

---

## 🚀 Quick Start Commands

From the `frontend/` directory:

| Task | Command | Description |
|---|---|---|
| **Build & Sync** | `npm run cap:build` | Compiles Angular and syncs web assets + plugins to both Android & iOS |
| **Sync Only** | `npm run cap:sync` | Syncs existing build into native project folders |
| **Open Android Studio** | `npm run cap:android` | Opens `frontend/android` in Android Studio |
| **Open Xcode (Mac)** | `npm run cap:ios` | Opens `frontend/ios/App` in Xcode |
| **Run on Android Device** | `npm run cap:run:android` | Builds and deploys directly to connected Android device / emulator |
| **Run on iOS Simulator** | `npm run cap:run:ios` | Builds and runs on selected iOS simulator |

---

## 🌐 Connecting Mobile Apps to the Flask Backend

When running on a phone or emulator, the mobile app connects to the Flask REST API:

### 1. Android Emulator
The Android emulator maps your host PC's `localhost` to **`http://10.0.2.2:8000`**.
- NutriPlan **automatically detects Android** and sets the backend default to `http://10.0.2.2:8000`.

### 2. iOS Simulator (Mac)
The iOS simulator shares the Mac's network stack directly:
- NutriPlan defaults to **`http://localhost:8000`**.

### 3. Physical Devices over Local Wi-Fi (Android / iPhone)
When running on a physical smartphone connected to the same Wi-Fi network as your computer:
1. Find your computer's local IP address (e.g. `ipconfig` on Windows or `ifconfig` on Mac/Linux → e.g. `192.168.1.105`).
2. Start the backend: `python start.py` (which binds to `0.0.0.0:8000`).
3. On the NutriPlan login screen in the mobile app, tap the **⚙ Server** button at the bottom and enter:
   ```
   http://192.168.1.105:8000
   ```
4. Tap **Test Ping** and then **Save & Apply**.

---

## 🤖 Android Build & Release Workflow

### Prerequisites
- [Android Studio Hedgehog / Iguana / Ladybug](https://developer.android.com/studio) or newer.
- Android SDK 34 / 35 installed.
- Java JDK 17 or 21.

### Step 1: Sync Assets
```bash
cd frontend
npm run cap:build
```

### Step 2: Open in Android Studio
```bash
npm run cap:android
```

### Step 3: Run / Build APK
- **Run on Emulator / Phone**: Select your device in the top toolbar and click **▶ Run** (Shift + F10).
- **Build Debug APK**: In Android Studio menu, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
  - The generated APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.
- **Build Release APK / AAB**: Go to **Build > Generate Signed Bundle / APK**.

---

## 🍏 iOS Build & Release Workflow (macOS)

### Prerequisites
- macOS Sonoma / Sequoia with [Xcode 15 / 16](https://developer.apple.com/xcode/).
- CocoaPods (`sudo gem install cocoapods`) or Swift Package Manager.

### Step 1: Sync Assets
```bash
cd frontend
npm run cap:build
```

### Step 2: Open in Xcode
```bash
npm run cap:ios
```

### Step 3: Run / Archive
- In Xcode, select your target simulator (e.g., iPhone 15 / 16 Pro) or your connected iPhone.
- Select your Development Team under **Signing & Capabilities**.
- Press **Cmd + R** to run.
- To produce an App Store / TestFlight build, select **Product > Archive**.

---

## 🛠️ Native Plugins Configured

- **`@capacitor/app`**: Native app lifecycle and Android hardware back-button support.
- **`@capacitor/status-bar`**: Styled status bar matching NutriPlan's `#0e8f4f` brand theme.
- **`@capacitor/splash-screen`**: Native launch screen with smooth fade-out.
- **`@capacitor/keyboard`**: Automatically resizes viewports when typing on mobile keyboards.
- **`@capacitor/preferences`**: High-performance persistent key-value storage.
