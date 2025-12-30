---
title: "Performance Tips for Three.js"
description: "Optimize your 3D scenes for better mobile performance."
date: 2024-12-15
tags: ["performance", "three.js", "optimization"]
---

Optimize your Three.js scenes for better performance across all devices. Here are the key strategies used in Astro Nightwalk.

## Reduce Polygon Count

Use simpler geometries where possible. For distant buildings, lower polygon counts are imperceptible but significantly improve performance.

```typescript
// Use BufferGeometry for better performance
const geometry = new THREE.BoxGeometry(width, height, depth);
```

## Texture Optimization

Use appropriately sized textures and enable mipmapping:

- Keep textures power-of-2 (256, 512, 1024)
- Use compressed formats when possible
- Generate textures procedurally to reduce load times

## Visibility Culling

Only render what's visible in the viewport. Astro Nightwalk uses a chunk-based system:

```typescript
// Only render chunks near the camera
if (distance > viewDistance) {
  chunk.visible = false;
}
```

## Mobile Optimization

The theme automatically adjusts quality for mobile devices:

- Lower pixel ratio (1.5x vs 2x on desktop)
- Fewer buildings (40 vs 60)
- Simplified shadows
- FPS-based quality adjustment

## Intersection Observer

Stop rendering when the scene is not in viewport:

```typescript
const observer = new IntersectionObserver((entries) => {
  isVisible = entries[0].isIntersecting;
});
```

This simple trick can save significant battery life on mobile devices.
