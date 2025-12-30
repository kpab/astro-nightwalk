import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  // 日付順でソート（新しい順）
  const sortedPosts = posts.sort((a, b) =>
    b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: 'Astro Nightwalk Blog',
    description: 'Tips, tutorials, and updates about Astro Nightwalk',
    site: context.site ?? 'https://example.com',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
