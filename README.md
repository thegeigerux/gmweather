# GMWeather

One-page Vite site for Gerald Mengel / GMWeather.

## Local Development

```sh
npm install
npm run dev
```

The local server runs the Vite app and the API routes at:

- `http://localhost:5173/api/latest-youtube`
- `http://localhost:5173/api/latest-tweets`

## Vercel Deployment

This project is prepared for Vercel as a static Vite app with serverless API routes:

- Static build output: `dist`
- Serverless routes: `api/latest-youtube.mjs`, `api/latest-tweets.mjs`
- Shared feed logic: `lib/social-feeds.mjs`

One-time setup:

```sh
vercel link --yes
```

Use a lowercase project name such as `gmweather` when Vercel asks. The current local folder name, `GMWeather`, is not a valid Vercel project name because Vercel requires lowercase names.

Deploy:

```sh
npm run vercel:deploy
```

Optional environment variables:

- `YOUTUBE_HANDLE`: defaults to `gmengelweather`
- `YOUTUBE_CHANNEL_ID`: defaults to `UCLwiT0bZKcLHU1BCvj_Pypw`
- `X_SCREEN_NAME`: defaults to `GMengel`

## Checks

```sh
npm run build
npm run lint
```
