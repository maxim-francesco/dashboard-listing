/**
 * Video utility module for classifying stored video values and extracting YouTube IDs/embed URLs.
 * Pure module: no React, no app imports, no network, no side effects.
 */

export type VideoSourceKind = 'cloudinary' | 'youtube' | 'unusable';

export type VideoSource =
  | { kind: 'cloudinary'; url: string }
  | { kind: 'youtube'; videoId: string; embedUrl: string }
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
 * Classifies a raw stored video value into 'cloudinary', 'youtube', or 'unusable'.
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

  return { kind: 'unusable' };
}
