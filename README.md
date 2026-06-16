# Baby Patterns (mobile)

Expo / React Native app for Baby Patterns tracking.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- **Local dev:** use your PC LAN IP (not `localhost`). Example: `EXPO_PUBLIC_API_URL=http://192.168.1.179:5251`
- **Android emulator:** `http://10.0.2.2:5251`
- **Production API:** `https://baby-patterns-server.onrender.com`

For local HTTP on Android, set `EXPO_PUBLIC_ALLOW_CLEARTEXT=true` in `.env` (enabled automatically for EAS `development` builds).

## Run

```bash
npm run start
```

## Quality checks

```bash
npm run typecheck
npm run lint
```

## Icons & splash

Regenerate from the web logo:

```bash
npm run generate-icons
```

## EAS builds

1. Install EAS CLI: `npm i -g eas-cli`
2. Log in: `eas login`
3. Configure project: `eas build:configure`
4. Set secrets for production (optional if using `eas.json` env):

   ```bash
   eas secret:create --name EXPO_PUBLIC_API_URL --value https://baby-patterns-server.onrender.com
   eas secret:create --name EXPO_PUBLIC_MEDIA_URL --value https://baby-patterns-server.onrender.com
   ```

Build profiles (`eas.json`):

- **development** — dev client, cleartext HTTP allowed
- **preview** — internal distribution, production API
- **production** — store builds, production API

```bash
eas build --profile preview --platform android
eas build --profile production --platform all
```

## Submit

```bash
eas submit --platform ios
eas submit --platform android
```
