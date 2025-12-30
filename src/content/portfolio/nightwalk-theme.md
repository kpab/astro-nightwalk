---
title: "Astro Nightwalk Theme"
description: "A stunning Three.js night city walkthrough theme for Astro. Features procedural building generation, dynamic lighting, and mobile-optimized performance."
date: 2024-12-25
tags: ["astro", "three.js", "webgl", "theme"]
image: "/images/portfolio/nightwalk-theme.jpg"
url: "https://example.com/nightwalk"
github: "https://github.com/example/astro-nightwalk"
featured: true
---

## Project Overview

Astro Nightwalk is a modern Astro theme featuring an immersive 3D cityscape experience powered by Three.js. The theme creates a stunning visual impact while maintaining excellent performance across all devices.

## Key Features

- **Procedural Generation**: Buildings are dynamically generated with varying heights, shapes, and window patterns
- **Dynamic Lighting**: Golden hour atmosphere with customizable sun position and colors
- **Mobile Optimized**: Automatic quality adjustment based on device capabilities
- **Chunk-based Rendering**: Infinite scroll through the city with efficient memory management

## Technical Stack

- Astro 5.0
- Three.js
- TypeScript
- Tailwind CSS

## Challenges & Solutions

The main challenge was maintaining 60 FPS on mobile devices. This was solved through:

1. Implementing visibility culling with Intersection Observer
2. Using a chunk-based system for infinite generation
3. Automatic pixel ratio adjustment based on FPS
