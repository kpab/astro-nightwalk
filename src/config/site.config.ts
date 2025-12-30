// サイト設定
// ここでサイト全体の設定をカスタマイズできます

export const siteConfig = {
  // 基本情報
  name: 'Night Walk',
  title: 'Developer & Designer',
  description: 'A portfolio and blog built with Astro Nightwalk theme',
  url: 'https://example.com', // デプロイ時に実際のURLに変更

  // 著者情報
  author: {
    name: 'Night Walk',
    email: 'hello@example.com',
    bio: 'A passionate developer and designer creating beautiful web experiences.',
    avatar: '/images/avatar.jpg', // プロフィール画像のパス
  },

  // SNSリンク
  social: {
    github: 'https://github.com/yourusername',
    twitter: 'https://twitter.com/yourusername',
    linkedin: 'https://linkedin.com/in/yourusername',
    // 使用しないSNSはコメントアウトまたは削除してください
    // instagram: 'https://instagram.com/yourusername',
    // youtube: 'https://youtube.com/@yourusername',
  },

  // ナビゲーション設定
  nav: {
    links: [
      { href: '/', label: 'Home' },
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/blog', label: 'Blog' },
      { href: '/about', label: 'About' },
    ],
  },

  // フッター設定
  footer: {
    copyright: `© ${new Date().getFullYear()} Night Walk. All rights reserved.`,
    showSocialLinks: true,
  },

  // ブログ設定
  blog: {
    title: 'Blog',
    description: 'Thoughts, tutorials, and updates',
    postsPerPage: 10,
  },

  // ポートフォリオ設定
  portfolio: {
    title: 'Portfolio',
    description: 'A showcase of my projects and work',
    projectsPerPage: 12,
  },
} as const;

export type SiteConfig = typeof siteConfig;
