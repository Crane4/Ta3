# Troubleshooting PlatformConstants Error

## The Error
```
TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found.
```

## Solutions

### Solution 1: Clear Cache and Restart (Most Common Fix)

1. **Stop the Expo server** (Ctrl+C)

2. **Clear all caches:**
```bash
# Clear Metro bundler cache
npx expo start --clear

# Or manually clear:
rm -rf node_modules/.cache
rm -rf .expo
npm start -- --reset-cache
```

3. **Restart the development server:**
```bash
npm start
```

### Solution 2: Reinstall Dependencies

If clearing cache doesn't work:

```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

### Solution 3: Check Expo Go Compatibility

If you're using **Expo Go**, some modules require custom native code and won't work. You have two options:

**Option A: Use Development Build**
```bash
# Install EAS CLI
npm install -g eas-cli

# Create a development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

**Option B: Use Expo Go Compatible Modules Only**

Remove or replace modules that require custom native code. All modules in this project should be Expo Go compatible, but if the error persists, try:

```bash
# Start with minimal setup
npx expo start
```

### Solution 4: Platform-Specific Fixes

**For iOS Simulator:**
```bash
# Reset iOS Simulator
xcrun simctl erase all

# Rebuild
npx expo run:ios
```

**For Android:**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Rebuild
npx expo run:android
```

### Solution 5: Check React Native Version Compatibility

The error can occur with version mismatches. Ensure compatibility:

```bash
# Check installed versions
npx expo install --check

# Fix version mismatches
npx expo install --fix
```

## Quick Fix Command

Run this single command to try all fixes:

```bash
rm -rf node_modules .expo && npm install --legacy-peer-deps && npx expo start --clear
```

## Still Having Issues?

1. **Check Expo SDK version compatibility**
2. **Ensure you're using the latest Expo Go app** (if using Expo Go)
3. **Try creating a new Expo project** and copying your code over
4. **Check Expo forums** for similar issues

