# Astro Nightwalk

A stunning Astro theme featuring an immersive 3D night cityscape with procedural building generation. Perfect for portfolios, blogs, and personal websites that want to make a memorable first impression.

![Astro Nightwalk Preview](./docs/preview.svg)

**[Live Demo](https://kpab.github.io/astro-nightwalk)**

## Features

- **Immersive 3D Hero Scene** - Procedurally generated night cityscape using Three.js with dynamic window lighting
- **Infinite City Scroll** - Chunk-based rendering system for continuous 3D exploration
- **Blog & Portfolio** - Full-featured content management with Astro Content Collections
- **Tag System** - Organize posts and projects with tags across the site
- **View Transitions** - Smooth page transitions with Astro's built-in View Transitions API
- **RSS Feed** - Auto-generated RSS feed for blog content
- **Sitemap** - Automatic sitemap generation for SEO
- **Fully Responsive** - Optimized for all screen sizes with mobile-first design
- **Accessibility** - ARIA labels, skip links, focus management, and reduced motion support
- **Performance Optimized** - Dynamic quality adjustment based on FPS, mobile device detection

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Astro 5](https://astro.build) |
| 3D Graphics | [Three.js](https://threejs.org) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| Type Safety | [TypeScript](https://www.typescriptlang.org) |
| Fonts | IBM Plex Sans, JetBrains Mono |

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/kpab/astro-nightwalk.git

# Navigate to project
cd astro-nightwalk

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:4321` to see your site.

### Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |

## Project Structure

```
astro-nightwalk/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── HeroScene.astro      # 3D city scene container
│   │   └── PortfolioCard.astro
│   ├── config/
│   │   ├── site.config.ts       # Site-wide configuration
│   │   └── nightwalk.config.ts  # 3D scene configuration
│   ├── content/
│   │   ├── posts/               # Blog posts (Markdown/MDX)
│   │   └── portfolio/           # Portfolio projects (Markdown/MDX)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── three/                   # Three.js scene logic
│   ├── pages/
│   │   ├── index.astro          # Homepage with 3D hero
│   │   ├── about.astro          # About page
│   │   ├── blog/                # Blog pages
│   │   ├── portfolio/           # Portfolio pages
│   │   └── tags/                # Tag pages
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── tailwind.config.mjs
└── tsconfig.json
```

## Configuration

### Site Configuration

Edit `src/config/site.config.ts` to customize your site:

```typescript
export const siteConfig = {
  name: 'Your Name',
  title: 'Your Title',
  description: 'Your site description',
  url: 'https://yoursite.com',

  author: {
    name: 'Your Name',
    email: 'hello@example.com',
    bio: 'Your bio here',
  },

  social: {
    github: 'https://github.com/username',
    twitter: 'https://twitter.com/username',
    linkedin: 'https://linkedin.com/in/username',
  },

  nav: {
    links: [
      { href: '/', label: 'Home' },
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/blog', label: 'Blog' },
      { href: '/about', label: 'About' },
    ],
  },
};
```

### 3D Scene Configuration

Customize the nightwalk scene in `src/config/nightwalk.config.ts`:

```typescript
export const nightwalkConfig = {
  buildings: {
    count: 60,          // Number of buildings
    minHeight: 15,      // Minimum building height
    maxHeight: 80,      // Maximum building height
  },

  lighting: {
    sunColor: 0xff7b00,
    sunIntensity: 1.2,
    ambientColor: 0x4a3a6a,
  },

  sky: {
    topColor: 0x1a0533,     // Deep purple
    middleColor: 0xff6b35,  // Orange
    bottomColor: 0xffb347,  // Golden
  },

  fog: {
    enabled: true,
    color: 0x2a1a3a,
    near: 50,
    far: 300,
  },

  performance: {
    mobilePixelRatio: 1.5,
    desktopPixelRatio: 2.0,
    mobileBuildingCount: 40,
  },
};
```

## Adding Content

### Blog Posts

Create a new file in `src/content/posts/`:

```markdown
---
title: "Your Post Title"
description: "A brief description"
date: 2025-01-15
tags: ["astro", "web"]
image: "/images/post-image.jpg"
draft: false
---

Your content here...
```

### Portfolio Projects

Create a new file in `src/content/portfolio/`:

```markdown
---
title: "Project Name"
description: "Project description"
date: 2025-01-15
tags: ["react", "typescript"]
image: "/images/project.jpg"
url: "https://project-demo.com"
github: "https://github.com/user/project"
featured: true
---

Project details here...
```

## Customization

### Colors

The theme uses a custom color palette defined in `tailwind.config.mjs`:

- **Primary**: Deep purple (`#1a0533`)
- **Accent**: Vibrant orange (`#ff6b35`)
- **Gold**: Warm gold (`#ffb347`)

### Fonts

Default fonts are loaded from Google Fonts:
- **Body**: IBM Plex Sans
- **Code**: JetBrains Mono

Change fonts in `tailwind.config.mjs` and `src/layouts/BaseLayout.astro`.

## Performance

The 3D scene includes several performance optimizations:

- **FPS Monitoring**: Automatically adjusts rendering quality based on frame rate
- **Mobile Detection**: Reduces building count and pixel ratio on mobile devices
- **Chunk-based Rendering**: Infinite scroll without memory leaks
- **Intersection Observer**: Only renders when visible
- **Reduced Motion**: Respects `prefers-reduced-motion` system setting

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

WebGL is required for the 3D scene. A fallback is shown for browsers without WebGL support.

## License

MIT License - feel free to use this template for personal or commercial projects.

---

Built with [Astro](https://astro.build) and [Three.js](https://threejs.org)
