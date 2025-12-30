---
title: "Customizing the Cityscape"
description: "Adjust buildings, lighting, and atmosphere to match your vision."
date: 2024-12-20
tags: ["tutorial", "customization", "three.js"]
---

The cityscape is fully customizable through the configuration file. This guide will show you how to create your perfect urban environment.

## Building Configuration

Adjust the number of buildings, their heights, and spacing in `nightwalk.config.ts`:

```typescript
buildings: {
  count: 60,           // Number of buildings
  minHeight: 15,       // Minimum height
  maxHeight: 80,       // Maximum height
  minWidth: 8,
  maxWidth: 20,
  spacing: 5,          // Gap between buildings
}
```

## Lighting

Change the sun color, intensity, and position for different moods:

```typescript
lighting: {
  sunColor: 0xff7b00,      // Orange sun
  sunIntensity: 1.2,
  sunPosition: { x: -50, y: 30, z: -50 },
  ambientColor: 0x4a3a6a,  // Purple ambient
}
```

## Sky Colors

Modify the gradient colors to create sunrise, sunset, or night scenes:

```typescript
sky: {
  topColor: 0x1a0533,      // Deep purple
  middleColor: 0xff6b35,   // Orange
  bottomColor: 0xffb347,   // Golden
}
```

## Window Lights

The buildings feature procedurally generated window patterns. You can adjust the warmth and density of the lights in the config file.
