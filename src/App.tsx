import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CalendarClock,
  Mail,
  MapPin,
  Play,
  Radio,
  Satellite,
  Siren,
} from 'lucide-react'
import './App.css'

type LatestVideo = {
  title: string
  videoUrl: string
  thumbnail: string
  published: string
  embedUrl: string
  channelUrl: string
  fallback: boolean
}

type LatestTweet = {
  id: string
  text: string
  createdAt: string
  url: string
}

type TweetFeed = {
  handle: string
  profileUrl: string
  tweets: LatestTweet[]
  fallback: boolean
}

const fallbackVideo: LatestVideo = {
  title: 'Latest GMWeather coverage',
  videoUrl: 'https://www.youtube.com/@gmengelweather',
  thumbnail: '',
  published: '',
  embedUrl: '',
  channelUrl: 'https://www.youtube.com/@gmengelweather',
  fallback: true,
}

const fallbackTweetFeed: TweetFeed = {
  handle: '@GMengel',
  profileUrl: 'https://x.com/GMengel',
  tweets: [
    {
      id: 'fallback',
      text: "Open @GMengel on X for Gerald's latest storm notes and field updates.",
      createdAt: '',
      url: 'https://x.com/GMengel',
    },
  ],
  fallback: true,
}

const socialLinks = [
  {
    platform: 'YouTube',
    handle: '@gmengelweather',
    href: 'https://www.youtube.com/@gmengelweather',
    accent: 'var(--youtube-accent)',
    icon: <Play aria-hidden="true" />,
  },
  {
    platform: 'Facebook',
    handle: 'GMWeather',
    href: 'https://www.facebook.com/GMWeather',
    accent: 'var(--facebook-accent)',
    icon: <span aria-hidden="true">f</span>,
  },
  {
    platform: 'TikTok',
    handle: '@GMWeather',
    href: 'https://www.tiktok.com/@GMWeather',
    accent: 'var(--tiktok-accent)',
    icon: <span aria-hidden="true">♪</span>,
  },
  {
    platform: 'X / Twitter',
    handle: '@GMengel',
    href: 'https://x.com/GMengel',
    accent: 'var(--twitter-accent)',
    icon: <span aria-hidden="true">X</span>,
  },
]

const coverageCards = [
  {
    title: 'Severe Weather Updates',
    copy: 'Fast, practical storm coverage when watches, warnings, and active threats develop.',
    icon: <Siren aria-hidden="true" />,
  },
  {
    title: 'Forecast Context',
    copy: 'Clear explanations of timing, confidence, and what the setup means for your day.',
    icon: <Satellite aria-hidden="true" />,
  },
  {
    title: 'Live Coverage',
    copy: 'Video-first updates across GMWeather channels when the weather starts moving.',
    icon: <Radio aria-hidden="true" />,
  },
]

const loadingTweets: LatestTweet[] = [
  {
    id: 'loading',
    text: 'Loading latest @GMengel posts...',
    createdAt: '',
    url: 'https://x.com/GMengel',
  },
]

function formatPublishedDate(date: string) {
  if (!date) return ''

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatRelativeTime(date: string) {
  if (!date) return ''

  const timestamp = new Date(date).getTime()
  if (Number.isNaN(timestamp)) return ''

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const divisions = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.345, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ] as const

  let duration = absSeconds
  for (const division of divisions) {
    if (duration < division.amount) {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round(diffSeconds < 0 ? -duration : duration),
        division.unit,
      )
    }
    duration /= division.amount
  }

  return ''
}

function App() {
  const [latestVideo, setLatestVideo] = useState<LatestVideo | null>(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(true)
  const [tweetFeed, setTweetFeed] = useState<TweetFeed | null>(null)

  useEffect(() => {
    let isMounted = true

    fetch('/api/latest-youtube')
      .then((response) => response.json())
      .then((video: LatestVideo) => {
        if (isMounted) setLatestVideo(video)
      })
      .catch(() => {
        if (isMounted) setLatestVideo(fallbackVideo)
      })
      .finally(() => {
        if (isMounted) setIsLoadingVideo(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    fetch('/api/latest-tweets')
      .then((response) => response.json())
      .then((tweets: TweetFeed) => {
        if (isMounted) setTweetFeed(tweets)
      })
      .catch(() => {
        if (isMounted) setTweetFeed(fallbackTweetFeed)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const video = latestVideo || fallbackVideo
  const publishedDate = formatPublishedDate(video.published)
  const tickerSource =
    tweetFeed && !tweetFeed.fallback && tweetFeed.tweets.length
      ? tweetFeed.tweets
      : loadingTweets
  const tickerTweets = [...tickerSource, ...tickerSource]

  return (
    <main>
      <section
        className={`tweet-ticker ${tweetFeed && !tweetFeed.fallback ? 'is-live' : 'is-loading'}`}
        aria-label="Latest posts from X"
      >
        <a className="ticker-label" href="https://x.com/GMengel" target="_blank">
          <span aria-hidden="true">X</span>
          Latest from @GMengel
        </a>
        <div className="ticker-track" aria-live="polite">
          <div className="ticker-items">
            <span className="ticker-spacer" aria-hidden="true" />
            {tickerTweets.map((tweet, index) => (
              <a href={tweet.url} key={`${tweet.id}-${index}`} target="_blank">
                {tweet.createdAt && (
                  <time dateTime={tweet.createdAt}>
                    {formatRelativeTime(tweet.createdAt)}
                  </time>
                )}
                {tweet.text}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="brand-line">
          <span />
          <p>GMWEATHER</p>
          <span />
        </div>

        <div className="hero-copy">
          <p className="eyebrow">About</p>
          <h1 id="hero-title">Gerald Mengel</h1>
          <p>
            Gerald Mengel is the meteorologist behind GMWeather, translating
            severe weather setups into clear, timely updates for people who need
            to know what is happening now and what may happen next.
          </p>
          <div className="about-meta hero-meta">
            <span>
              <MapPin aria-hidden="true" />
              Regional weather coverage
            </span>
            <span>
              <Mail aria-hidden="true" />
              Contact details coming soon
            </span>
          </div>
        </div>
      </section>

      <section className="latest-video" aria-labelledby="latest-video-title">
        <div className="section-heading">
          <p>Latest Coverage</p>
          <h2 id="latest-video-title">Latest YouTube Video</h2>
        </div>

        <div className="video-panel">
          <div className="video-frame">
            {isLoadingVideo ? (
              <div className="video-placeholder">
                <Play aria-hidden="true" />
                <span>Loading latest video</span>
              </div>
            ) : video.embedUrl ? (
              <iframe
                src={video.embedUrl}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <a className="video-placeholder" href={video.channelUrl}>
                <Play aria-hidden="true" />
                <span>Open GMWeather on YouTube</span>
              </a>
            )}
          </div>

          <div className="video-details">
            <p className="panel-label">
              {video.fallback ? 'YouTube Channel' : 'Newest Upload'}
            </p>
            <h3>{isLoadingVideo ? 'Finding the latest GMWeather video' : video.title}</h3>
            {publishedDate && (
              <p className="published">
                <CalendarClock aria-hidden="true" />
                Published {publishedDate}
              </p>
            )}
            <a className="cta-link" href={video.videoUrl} target="_blank">
              Watch on YouTube
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="follow" className="follow-section" aria-labelledby="follow-title">
        <div className="section-heading">
          <p>Stay Connected</p>
          <h2 id="follow-title">Follow GMWeather</h2>
        </div>

        <div className="social-list">
          {socialLinks.map((link) => (
            <a
              className="social-card"
              href={link.href}
              key={link.platform}
              style={{ '--platform-accent': link.accent } as React.CSSProperties}
              target="_blank"
            >
              <span className="accent-line" />
              <span className="social-icon">{link.icon}</span>
              <span>
                <span className="social-platform">{link.platform}</span>
                <strong>{link.handle}</strong>
              </span>
              <ArrowUpRight className="social-arrow" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="coverage-grid" aria-label="GMWeather coverage areas">
        {coverageCards.map((card) => (
          <article className="coverage-card" key={card.title}>
            <div className="coverage-icon">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="final-cta" aria-label="Notification reminder">
        <p>Turn on notifications so you never miss a severe weather update.</p>
      </section>

      <footer className="site-footer">
        <p>Made with ♥ James Geiger</p>
      </footer>
    </main>
  )
}

export default App
