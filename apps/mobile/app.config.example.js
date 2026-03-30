/**
 * Configuration file for Expo app with background audio playback support
 * 
 * This file shows the required configurations for iOS and Android
 * to enable background audio playback when the app is backgrounded.
 */

module.exports = {
  expo: {
    name: "ClaudyGod",
    slug: "claudygod",
    version: "1.0.0",
    scheme: "claudygod",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    
    // Splash screen configuration
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1a1a1a",
    },

    // Background audio and playback configuration
    plugins: [
      [
        "expo-av",
        {
          // iOS specific audio configuration
          microphonePermission: "Allow ClaudyGod to access your microphone for voice chat.",
          
          // Android specific audio configuration
          mediaLibraryPermission: "Allow ClaudyGod to access your media library.",
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            // Enable background modes for audio playback
            backgroundModes: ["audio"],
            
            // Privacy permissions
            infoPlist: {
              // Allow playing audio in background
              UIBackgroundModes: ["audio"],
              
              // Microphone access
              NSMicrophoneUsageDescription:
                "ClaudyGod needs access to your microphone for voice calls and recordings.",
              
              // Media library access
              NSAppleMusicUsageDescription:
                "ClaudyGod needs to access your music library.",
              
              // Camera (if needed for video calls)
              NSCameraUsageDescription:
                "ClaudyGod needs camera access for video calls.",
              
              // Location (if needed)
              NSLocationWhenInUseUsageDescription:
                "ClaudyGod needs your location for local content.",
            },
          },
          android: {
            // Permissions needed for audio playback
            permissions: [
              "android.permission.INTERNET",
              "android.permission.ACCESS_NETWORK_STATE",
              "android.permission.MODIFY_AUDIO_SETTINGS",
              "android.permission.RECORD_AUDIO",
              "android.permission.READ_EXTERNAL_STORAGE",
              "android.permission.WRITE_EXTERNAL_STORAGE",
            ],
            
            // Allow playback in background
            usesCleartextTraffic: true,
            
            // Min SDK for audio features
            minSdkVersion: 24,
          },
        },
      ],
    ],

    // iOS specific settings
    ios: {
      supportsTabletMode: true,
      infoPlist: {
        // Audio session configuration
        AVAudioSessionCategory: "Playback",
        AVAudioSessionCategoryOptions: [
          "DefaultToSpeaker",
          "DuckOthers",
          "InterruptSpokenAudioAndMixWithOthers",
        ],
        
        // Background modes
        UIBackgroundModes: ["audio", "fetch"],
        
        // Privacy descriptions (already in expo-build-properties but listed for clarity)
        NSMicrophoneUsageDescription:
          "ClaudyGod needs access to your microphone.",
        NSAppleMusicUsageDescription:
          "ClaudyGod needs to access your music.",
        NSCameraUsageDescription:
          "ClaudyGod needs camera access for video.",
      },
    },

    // Android specific settings
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a1a1a",
      },
      
      // Splash screen
      splash: {
        image: "./assets/splash-android.png",
        resizeMode: "contain",
        backgroundColor: "#1a1a1a",
      },

      // Permissions for audio playback
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.FOREGROUND_SERVICE",
      ],
    },

    // Web configuration (if needed)
    web: {
      favicon: "./assets/favicon.png",
    },

    // Notification configuration
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#FF6B6B",
      sounds: ["notification-sound.wav"],
    },

    // EAS Build configuration
    extra: {
      eas: {
        projectId: "your-project-id",
      },
      // Custom configuration
      API_URL: process.env.EXPO_PUBLIC_API_URL || "https://api.claudygod.com",
      ENV: process.env.EXPO_PUBLIC_ENV || "development",
    },

    // Updates
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/your-project-id",
    },

    // Runtimes
    runtimeVersion: {
      policy: "appVersion",
    },
  },
};
