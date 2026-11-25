# A Universe Made Just for Charu

A responsive, seven-scene birthday experience built with React, TypeScript, Vite, Framer Motion, Three.js, and React Three Fiber. The gift boxes and three-tier cake are procedural 3D mesh scenes with lighting, material detail, shadows, interactive pointer parallax, floating motion, and particle effects. No model downloads are required.

## Run locally

Requires Node.js 20.19+ or 22.12+ (Vite 8 requirement).

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; serve it locally with `npm run preview`.

## Personalize

Edit `src/birthdayConfig.ts` to change Charu's name, birthday date, copy, memory images and captions, audio file paths, candle count, colors, and optional surprise media. Memory and surprise image paths should be served from `public/` (for example `/photos/photo1.jpg`). Audio files are optional; the sound control stays quiet if no ambient track is configured.

The cake's microphone button requests browser microphone access and listens for sustained audio above a volume threshold. The no-microphone button provides the same celebration without audio input. Microphone access requires localhost or HTTPS. A browser permission denial or unsupported microphone keeps the manual option available.

The memory gallery includes the four birthday illustrations supplied for Charu in `public/photos/`. Image titles and captions are editable in the config. Put replacement images and audio in `public/` and reference them with root paths such as `/photos/photo1.jpg` and `/audio/ambient.mp3`. An empty audio path is handled quietly by the sound control.

The 3D scenes load on demand when first visited, reducing the initial page payload. They use geometric meshes built in code rather than external model files, so all geometry and materials remain easy to change in `src/BirthdayObjects.tsx`.
