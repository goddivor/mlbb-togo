import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Proxy the YouTube Data API server-side so the API key never reaches the
// browser. Returns a { videoId: viewCount } map for the requested ids.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoIds = searchParams.get('videoIds');

    if (!videoIds) {
      return NextResponse.json({ error: 'videoIds is required' }, { status: 400 });
    }

    // No key configured: degrade gracefully so the page still renders.
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ views: {}, fallback: true });
    }

    const ids = videoIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No valid video IDs provided' }, { status: 400 });
    }

    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set('part', 'statistics');
    url.searchParams.set('id', ids.join(','));
    url.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API error:', response.status, errorText);
      // Quota/permission errors should not break the page.
      return NextResponse.json({ views: {}, fallback: true });
    }

    const data = await response.json();

    const viewsMap: Record<string, string> = {};
    for (const item of data.items ?? []) {
      const id = item.id;
      const viewCount = item.statistics?.viewCount;
      if (id && viewCount) {
        viewsMap[id] = viewCount;
      }
    }

    return NextResponse.json({ views: viewsMap });
  } catch (error) {
    console.error('YouTube views API error:', error);
    return NextResponse.json({ views: {}, fallback: true });
  }
}
