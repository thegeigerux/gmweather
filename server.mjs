import express from 'express'
import { createServer as createViteServer } from 'vite'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  cacheFallbackTweets,
  fallbackVideo,
  fetchLatestTweets,
  fetchLatestVideo,
} from './lib/social-feeds.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 5173)
const app = express()

app.get('/api/latest-youtube', async (_request, response) => {
  try {
    response.json(await fetchLatestVideo())
  } catch (error) {
    console.error(error)
    response.status(200).json(fallbackVideo)
  }
})

app.get('/api/latest-tweets', async (_request, response) => {
  try {
    response.json(await fetchLatestTweets())
  } catch (error) {
    console.error(error)
    response.status(200).json(cacheFallbackTweets())
  }
})

if (isProduction) {
  app.use(express.static(resolve(__dirname, 'dist')))
  app.use(async (_request, response) => {
    const html = await readFile(resolve(__dirname, 'dist/index.html'), 'utf8')
    response.type('html').send(html)
  })
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  })

  app.use(vite.middlewares)
}

app.listen(port, () => {
  console.log(`GMWeather site running at http://localhost:${port}`)
})
