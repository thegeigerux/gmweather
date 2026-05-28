import { cacheFallbackTweets, fetchLatestTweets } from '../lib/social-feeds.mjs'

export default async function handler(_request, response) {
  response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300')

  try {
    response.status(200).json(await fetchLatestTweets())
  } catch (error) {
    console.error(error)
    response.status(200).json(cacheFallbackTweets())
  }
}
