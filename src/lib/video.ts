/**
 * Video utility module for classifying stored video values and extracting YouTube/TikTok IDs/embed URLs.
 * Pure module: no React, no app imports, no network, no side effects.
 */

export type VideoSourceKind = 'cloudinary' | 'youtube' | 'tiktok' | 'unusable';

export type VideoSource =
  | { kind: 'cloudinary'; url: string }
  | { kind: 'youtube'; videoId: string; embedUrl: string }
  | { kind: 'tiktok'; url: string; videoId: string; embedUrl: string }
  | { kind: 'tiktok'; url: string; videoId: null; embedUrl: null }
  | { kind: 'unusable' };

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts an 11-character YouTube video ID from a URL, iframe src, or raw ID.
 * Returns null if the input is not a valid or plausible YouTube reference.
 */
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Raw 11-char ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    if (/^(https?:)?\/\//i.test(trimmed)) {
      url = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed);
    } else if (
      /^(www\.|m\.|music\.)?youtube\.com/i.test(trimmed) ||
      /^(www\.)?youtu\.be/i.test(trimmed)
    ) {
      url = new URL(`https://${trimmed}`);
    } else {
      return null;
    }
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();

  // Host: youtu.be
  if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && YOUTUBE_ID_REGEX.test(parts[0])) {
      return parts[0];
    }
    return null;
  }

  // Host: youtube.com
  if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
    const pathname = url.pathname;

    if (pathname === '/watch' || pathname === '/watch/') {
      const v = url.searchParams.get('v');
      if (v && YOUTUBE_ID_REGEX.test(v)) {
        return v;
      }
      return null;
    }

    if (pathname.startsWith('/shorts/')) {
      const parts = pathname.slice('/shorts/'.length).split('/').filter(Boolean);
      if (parts.length > 0 && YOUTUBE_ID_REGEX.test(parts[0])) {
        return parts[0];
      }
      return null;
    }

    if (pathname.startsWith('/embed/')) {
      const parts = pathname.slice('/embed/'.length).split('/').filter(Boolean);
      if (parts.length > 0 && YOUTUBE_ID_REGEX.test(parts[0])) {
        return parts[0];
      }
      return null;
    }

    if (pathname.startsWith('/v/')) {
      const parts = pathname.slice('/v/'.length).split('/').filter(Boolean);
      if (parts.length > 0 && YOUTUBE_ID_REGEX.test(parts[0])) {
        return parts[0];
      }
      return null;
    }
  }

  return null;
}

/**
 * Extracts a TikTok video ID (numeric digits) from a URL or raw ID.
 * Returns null if the input is a short link or not a valid full TikTok video URL.
 */
export function extractTikTokId(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Raw numeric video ID (15-22 digits)
  if (/^\d{15,22}$/.test(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    if (/^(https?:)?\/\//i.test(trimmed)) {
      url = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed);
    } else if (/^(www\.|m\.|vm\.|vt\.)?tiktok\.com/i.test(trimmed)) {
      url = new URL(`https://${trimmed}`);
    } else {
      return null;
    }
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) {
    const match = url.pathname.match(/\/video\/(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns TikTok official embed URL if video ID can be extracted, otherwise null.
 */
export function getTikTokEmbedUrl(inputOrId: string | null | undefined): string | null {
  const id = extractTikTokId(inputOrId);
  if (!id) return null;
  return `https://www.tiktok.com/embed/v2/${id}`;
}

function parseTikTokSource(trimmed: string): { url: string; videoId: string | null; embedUrl: string | null } | null {
  let url: URL;
  try {
    if (/^(https?:)?\/\//i.test(trimmed)) {
      url = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed);
    } else if (/^(www\.|m\.|vm\.|vt\.)?tiktok\.com/i.test(trimmed)) {
      url = new URL(`https://${trimmed}`);
    } else {
      return null;
    }
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname !== 'tiktok.com' && !hostname.endsWith('.tiktok.com')) {
    return null;
  }

  // 1. Check for full video URL with /video/12345...
  const videoMatch = url.pathname.match(/\/video\/(\d+)/);
  if (videoMatch && videoMatch[1]) {
    const videoId = videoMatch[1];
    return {
      url: trimmed,
      videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
    };
  }

  // 2. Check for shortened link (e.g. vm.tiktok.com/ZNRHFFUBd/, vt.tiktok.com/..., tiktok.com/t/...)
  const isShortHost =
    hostname === 'vm.tiktok.com' ||
    hostname.endsWith('.vm.tiktok.com') ||
    hostname === 'vt.tiktok.com' ||
    hostname.endsWith('.vt.tiktok.com') ||
    (hostname === 'tiktok.com' && url.pathname.startsWith('/t/'));

  if (isShortHost) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      return {
        url: trimmed,
        videoId: null,
        embedUrl: null,
      };
    }
  }

  return null;
}

/**
 * Classifies a raw stored video value into 'cloudinary', 'youtube', 'tiktok', or 'unusable'.
 */
export function classifyVideoSource(input: string | null | undefined): VideoSourceKind {
  if (!input) return 'unusable';
  const trimmed = input.trim();
  if (!trimmed) return 'unusable';

  if (trimmed.includes('cloudinary.com') || trimmed.includes('res.cloudinary.com')) {
    return 'cloudinary';
  }

  if (extractYouTubeId(trimmed) !== null) {
    return 'youtube';
  }

  if (parseTikTokSource(trimmed) !== null) {
    return 'tiktok';
  }

  return 'unusable';
}

/**
 * Converts a raw input or extracted YouTube video ID into a standard YouTube embed URL.
 * Returns null if the input does not yield a valid YouTube ID.
 */
export function getYouTubeEmbedUrl(inputOrId: string | null | undefined): string | null {
  const id = extractYouTubeId(inputOrId);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

/**
 * Parses and returns a discriminated union result for safe handling of video sources.
 */
export function parseVideoSource(input: string | null | undefined): VideoSource {
  if (!input) return { kind: 'unusable' };
  const trimmed = input.trim();
  if (!trimmed) return { kind: 'unusable' };

  if (trimmed.includes('cloudinary.com') || trimmed.includes('res.cloudinary.com')) {
    return { kind: 'cloudinary', url: trimmed };
  }

  const videoId = extractYouTubeId(trimmed);
  if (videoId) {
    return {
      kind: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  const tikTokSource = parseTikTokSource(trimmed);
  if (tikTokSource) {
    if (tikTokSource.videoId !== null && tikTokSource.embedUrl !== null) {
      return {
        kind: 'tiktok',
        url: tikTokSource.url,
        videoId: tikTokSource.videoId,
        embedUrl: tikTokSource.embedUrl,
      };
    } else {
      return {
        kind: 'tiktok',
        url: tikTokSource.url,
        videoId: null,
        embedUrl: null,
      };
    }
  }

  return { kind: 'unusable' };
}
