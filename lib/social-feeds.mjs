import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { XMLParser } from 'fast-xml-parser'

const execFileAsync = promisify(execFile)

export const youtubeHandle = process.env.YOUTUBE_HANDLE || 'gmengelweather'
export const configuredChannelId =
  process.env.YOUTUBE_CHANNEL_ID || 'UCLwiT0bZKcLHU1BCvj_Pypw'
export const xScreenName = process.env.X_SCREEN_NAME || 'GMengel'

const cacheTtlMs = 10 * 60 * 1000
const tweetFailureCacheTtlMs = 60 * 1000
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
})

let cachedVideo = null
let cachedVideoAt = 0
let cachedTweets = null
let cachedTweetsAt = 0

export const fallbackVideo = {
  title: 'Latest GMWeather coverage',
  videoUrl: `https://www.youtube.com/@${youtubeHandle}`,
  thumbnail: '',
  published: '',
  embedUrl: '',
  channelUrl: `https://www.youtube.com/@${youtubeHandle}`,
  fallback: true,
}

export const fallbackTweets = {
  handle: `@${xScreenName}`,
  profileUrl: `https://x.com/${xScreenName}`,
  tweets: [
    {
      id: 'fallback-live',
      text: `Open @${xScreenName} on X for Gerald's latest storm notes and field updates.`,
      createdAt: '',
      url: `https://x.com/${xScreenName}`,
    },
    {
      id: 'fallback-youtube',
      text: 'For video updates, watch the latest GMWeather coverage below.',
      createdAt: '',
      url: `https://www.youtube.com/@${youtubeHandle}`,
    },
  ],
  fallback: true,
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`)
  }

  return response.text()
}

async function fetchTextWithCurl(url) {
  const { stdout } = await execFileAsync('curl', [
    '-L',
    '-s',
    '-A',
    'Mozilla/5.0',
    url,
  ])

  if (!stdout.trim()) {
    throw new Error(`Curl returned an empty response for ${url}`)
  }

  return stdout
}

function findChannelIdFromPage(html) {
  const patterns = [
    /feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]+)/,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)["']/,
    /<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[a-zA-Z0-9_-]+)["']/,
    /"channelId":"(UC[^"]+)"/,
    /"externalId":"(UC[^"]+)"/,
    /\/channel\/(UC[a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1]
  }

  return ''
}

async function resolveChannelId() {
  if (configuredChannelId) return configuredChannelId

  const html = await fetchText(`https://www.youtube.com/@${youtubeHandle}`)
  const channelId = findChannelIdFromPage(html)

  if (!channelId) {
    throw new Error(`Could not resolve channel ID for @${youtubeHandle}`)
  }

  return channelId
}

function normalizeVideoEntry(entry) {
  const videoId = entry?.['yt:videoId']
  const title = entry?.title || fallbackVideo.title
  const published = entry?.published || ''
  const thumbnail =
    entry?.['media:group']?.['media:thumbnail']?.url ||
    (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '')

  return {
    title,
    videoUrl: videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/@${youtubeHandle}`,
    thumbnail,
    published,
    embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : '',
    channelUrl: `https://www.youtube.com/@${youtubeHandle}`,
    fallback: false,
  }
}

export async function fetchLatestVideo() {
  if (cachedVideo && Date.now() - cachedVideoAt < cacheTtlMs) {
    return cachedVideo
  }

  const channelId = await resolveChannelId()
  const feedXml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
  )
  const feed = parser.parse(feedXml)
  const entries = Array.isArray(feed?.feed?.entry)
    ? feed.feed.entry
    : feed?.feed?.entry
      ? [feed.feed.entry]
      : []

  if (!entries.length) {
    throw new Error('YouTube feed returned no videos')
  }

  cachedVideo = normalizeVideoEntry(entries[0])
  cachedVideoAt = Date.now()
  return cachedVideo
}

function cleanTweetText(text) {
  return String(text || '')
    .replace(/\s*https:\/\/t\.co\/\S+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeRssItems(items) {
  const list = Array.isArray(items) ? items : items ? [items] : []

  return list
    .map((item) => {
      const id = String(item.guid?.['#text'] || item.guid || item.link || item.title)
      const nitterUrl = String(item.link || `https://nitter.net/${xScreenName}`)

      return {
        id,
        text: cleanTweetText(item.title),
        createdAt: item.pubDate || '',
        url: nitterUrl.replace('https://nitter.net/', 'https://x.com/').replace('#m', ''),
      }
    })
    .filter((tweet) => tweet.text && !tweet.text.startsWith(`R to @${xScreenName}:`))
    .slice(0, 6)
}

async function fetchLatestTweetsFromRss() {
  const rss = await fetchTextWithCurl(`https://nitter.net/${xScreenName}/rss`)
  const feed = parser.parse(rss)
  const tweets = normalizeRssItems(feed?.rss?.channel?.item)

  if (!tweets.length) {
    throw new Error(`Nitter RSS returned no tweets for @${xScreenName}`)
  }

  return tweets
}

export async function fetchLatestTweets() {
  const tweetCacheAge = Date.now() - cachedTweetsAt

  if (
    cachedTweets &&
    tweetCacheAge < (cachedTweets.fallback ? tweetFailureCacheTtlMs : cacheTtlMs)
  ) {
    return cachedTweets
  }

  const tweets = await fetchLatestTweetsFromRss()

  if (!tweets.length) {
    throw new Error(`No tweets found for @${xScreenName}`)
  }

  cachedTweets = {
    handle: `@${xScreenName}`,
    profileUrl: `https://x.com/${xScreenName}`,
    tweets,
    fallback: false,
  }
  cachedTweetsAt = Date.now()

  return cachedTweets
}

export function cacheFallbackTweets() {
  cachedTweets = fallbackTweets
  cachedTweetsAt = Date.now()
  return fallbackTweets
}
