# SAMER - Smart Accident Monitoring & Emergency Response

A React Native mobile application built with Expo SDK 54 that uses computer vision technology to detect road accidents and dangerous driving behaviors, automatically alerting emergency services.

## Features

- 🚨 **Real-time Accident Detection**: Uses computer vision to detect road accidents through the device camera
- ⚠️ **Dangerous Behavior Monitoring**: 
  - Sudden lane departures
  - Abnormal stopping patterns
  - Driver behavior analysis
- 📍 **Automatic Emergency Alerts**: Sends real-time alerts to emergency services with location data
- 📊 **Risk Analytics**: 
  - Identifies high-risk areas
  - Predicts potential accident locations
  - Tracks incident trends
- 📱 **Mobile-First Design**: Beautiful, responsive UI optimized for mobile devices

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Physical device with camera (recommended for testing)

## Installation

1. Clone the repository or navigate to the project directory:
```bash
cd SA3
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Run on your device:
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## Project Structure

```
SA3/
├── App.js                 # Main application entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
├── babel.config.js       # Babel configuration
├── assets/               # App icons, splash screens, etc.
└── src/
    ├── screens/          # Screen components
    │   ├── HomeScreen.js
    │   ├── CameraScreen.js
    │   ├── AnalyticsScreen.js
    │   └── SettingsScreen.js
    └── services/         # Business logic services
        ├── visionService.js      # Computer vision detection
        ├── alertService.js       # Emergency alert system
        ├── storageService.js     # Data persistence
        └── analyticsService.js   # Risk analysis and predictions
```

## Key Components

### Screens

- **HomeScreen**: Main dashboard with statistics and quick actions
- **CameraScreen**: Real-time camera monitoring with accident detection
- **AnalyticsScreen**: Risk analysis, predictions, and incident trends
- **SettingsScreen**: App configuration and preferences

### Services

- **visionService**: Computer vision detection algorithms (currently simulated)
- **alertService**: Emergency notification system
- **storageService**: Local data persistence using AsyncStorage
- **analyticsService**: Risk assessment and prediction algorithms

## Permissions

The app requires the following permissions:

- **Camera**: For real-time video processing and accident detection
- **Location**: For sending accurate location data with emergency alerts
- **Notifications**: For alerting users about detected incidents

## Configuration

### Emergency Contact

Set your emergency contact number in Settings. Default is "911".

### Detection Sensitivity

Adjust detection sensitivity in Settings:
- **Low**: Fewer false positives, may miss some incidents
- **Medium**: Balanced detection (recommended)
- **High**: More sensitive, may have more false positives

## Development Notes

### Computer Vision Implementation

The current implementation uses simulated detection algorithms. In production, this would be replaced with:

- Trained ML models (e.g., YOLO, MobileNet)
- TensorFlow.js or similar ML framework
- Real-time frame processing pipeline
- Object detection for vehicles, debris, smoke
- Motion analysis for sudden stops and lane departures

### Emergency Alert System

The alert system is currently set up to:
- Send local notifications
- Log incidents to local storage
- Prepare data for API integration

To integrate with actual emergency services:
1. Update `sendToEmergencyAPI()` in `src/services/alertService.js`
2. Add your emergency services API endpoint
3. Configure authentication and API keys

## Future Enhancements

- [ ] Integration with actual ML models for computer vision
- [ ] Real-time emergency services API integration
- [ ] Cloud data synchronization
- [ ] Multi-language support
- [ ] Offline mode improvements
- [ ] Advanced analytics dashboard
- [ ] Integration with vehicle telematics

## Troubleshooting

### Dependencies Issues

If you encounter dependency conflicts:
```bash
npm install --legacy-peer-deps
```

### Metro Bundler Issues

Clear cache and restart:
```bash
npm start -- --clear
```

### Camera Not Working

- Ensure camera permissions are granted
- Test on a physical device (simulators may have limited camera support)
- Check that expo-camera is properly installed

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.

---

**Note**: This application is designed for demonstration and development purposes. For production use, ensure proper ML model integration, API security, and compliance with local regulations regarding emergency services.

