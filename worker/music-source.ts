export const HYL_MUSIC_PROVIDER = "xiaolin" as const;
export const HYL_MUSIC_INTERNAL_ORIGIN = "https://hyl-music.internal";
export const HYL_MUSIC_PUBLIC_ORIGIN = "https://music.elin521.cn";

export type HylMusicSearchTrack = {
  sourceId: string;
  name: string;
  artist: string;
  album: string;
  coverUrl: string;
  durationMs: number;
};

export type HylMusicTrackMetadata = HylMusicSearchTrack & {
  primaryArtistId: string;
  artistAvatarUrl: string;
};

export type HylMusicAudio = {
  url: string;
  size: number;
  extension: "mp3" | "m4a" | "aac" | "ogg" | "wav" | "webm" | "flac";
  contentType: string;
  durationMs: number;
};

export type HylMusicLyrics = {
  lrc: string;
  translatedLrc: string;
  romanizedLrc: string;
};

const AUDIO_TYPE_BY_EXTENSION: Record<HylMusicAudio["extension"], string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  wav: "audio/wav",
  webm: "audio/webm",
  flac: "audio/flac",
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function cleanText(value: unknown, maxLength = 300): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function positiveInteger(value: unknown): number {
  const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof number === "number" && Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function artistsText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((artist) => cleanText(record(artist)?.name, 100))
    .filter(Boolean)
    .join("、")
    .slice(0, 300);
}

export function trustedMusicMediaUrl(value: unknown): string {
  const raw = cleanText(value, 2_000);
  if (!raw) return "";
  let parsed: URL;
  try { parsed = new URL(raw); }
  catch { throw new Error("音源返回了无效的媒体地址"); }
  if (!new Set(["http:", "https:"]).has(parsed.protocol)
    || parsed.username || parsed.password || parsed.port
    || (parsed.hostname !== "music.126.net" && !parsed.hostname.endsWith(".music.126.net"))) {
    throw new Error("音源返回了不受信任的媒体地址");
  }
  parsed.protocol = "https:";
  parsed.hash = "";
  return parsed.toString();
}

function normalizedTrack(item: unknown): HylMusicSearchTrack | null {
  const song = record(item);
  if (!song) return null;
  const id = positiveInteger(song.id);
  const name = cleanText(song.name, 200);
  if (!id || !name) return null;
  const album = record(song.al);
  let coverUrl = "";
  try { coverUrl = trustedMusicMediaUrl(album?.picUrl); }
  catch { coverUrl = ""; }
  return {
    sourceId: String(id),
    name,
    artist: artistsText(song.ar),
    album: cleanText(album?.name, 200),
    coverUrl,
    durationMs: Math.max(0, Math.min(24 * 60 * 60 * 1_000, positiveInteger(song.dt))),
  };
}

export function parseHylMusicSearch(value: unknown): HylMusicSearchTrack[] {
  const songs = record(record(value)?.result)?.songs;
  if (!Array.isArray(songs)) return [];
  return songs.map(normalizedTrack).filter((track): track is HylMusicSearchTrack => Boolean(track));
}

export function parseHylMusicDetail(value: unknown, sourceId: string): HylMusicTrackMetadata {
  const songs = record(value)?.songs;
  const expectedId = positiveInteger(sourceId);
  const item = Array.isArray(songs)
    ? songs.find((song) => positiveInteger(record(song)?.id) === expectedId)
    : undefined;
  const track = normalizedTrack(item);
  if (!track) throw new Error("小琳音乐站没有返回这首歌的完整信息");
  const artists = record(item)?.ar;
  const firstArtist = Array.isArray(artists) ? record(artists[0]) : null;
  return {
    ...track,
    primaryArtistId: String(positiveInteger(firstArtist?.id) || ""),
    artistAvatarUrl: "",
  };
}

export function parseHylArtistAvatar(value: unknown, artistId: string): string {
  const artists = record(record(value)?.result)?.artists;
  const expectedId = positiveInteger(artistId);
  if (!Array.isArray(artists) || !expectedId) return "";
  const artist = record(artists.find((item) => positiveInteger(record(item)?.id) === expectedId));
  if (!artist) return "";
  try { return trustedMusicMediaUrl(artist.picUrl || artist.img1v1Url); }
  catch { return ""; }
}

export function parseHylMusicAudio(value: unknown, sourceId: string): HylMusicAudio {
  const data = record(value)?.data;
  const expectedId = positiveInteger(sourceId);
  const item = Array.isArray(data)
    ? record(data.find((entry) => positiveInteger(record(entry)?.id) === expectedId))
    : null;
  if (!item || Number(item.code) !== 200 || item.freeTrialInfo) {
    throw new Error("这首歌当前没有可完整导入的音频");
  }
  const extension = cleanText(item.type, 12).toLowerCase() as HylMusicAudio["extension"];
  if (!Object.hasOwn(AUDIO_TYPE_BY_EXTENSION, extension)) throw new Error("音源返回了不支持的音频格式");
  const size = positiveInteger(item.size);
  if (!size) throw new Error("音源没有返回有效的音频大小");
  return {
    url: trustedMusicMediaUrl(item.url),
    size,
    extension,
    contentType: AUDIO_TYPE_BY_EXTENSION[extension],
    durationMs: Math.max(0, Math.min(24 * 60 * 60 * 1_000, positiveInteger(item.time))),
  };
}

export function parseHylMusicLyrics(value: unknown): HylMusicLyrics {
  const root = record(value);
  return {
    lrc: cleanText(record(root?.lrc)?.lyric, 256 * 1_024),
    translatedLrc: cleanText(record(root?.tlyric)?.lyric, 256 * 1_024),
    romanizedLrc: cleanText(record(root?.romalrc)?.lyric, 256 * 1_024),
  };
}

export function isSupportedAudioContentType(value: string, extension: HylMusicAudio["extension"]): boolean {
  const normalized = value.split(";")[0].trim().toLowerCase();
  if (normalized === AUDIO_TYPE_BY_EXTENSION[extension]) return true;
  return extension === "mp3" && normalized === "audio/mp3"
    || extension === "m4a" && normalized === "audio/x-m4a"
    || extension === "ogg" && normalized === "application/ogg"
    || extension === "wav" && normalized === "audio/x-wav"
    || extension === "flac" && normalized === "audio/x-flac";
}
