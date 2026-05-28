import { fallbackVideo, fetchLatestVideo } from '../lib/social-feeds.mjs'

export default async function handler(_request, response) {
  response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300')

  try {
    response.status(200).json(await fetchLatestVideo())
  } catch (error) {
    console.error(error)
    response.status(200).json(fallbackVideo)
  }
}
