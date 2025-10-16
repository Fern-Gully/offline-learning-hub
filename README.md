# offline-learning-hub

Modernised LAN Arcade front-end lives in `srv/games/www` as a Vite-powered React application.

## Developing the arcade UI

```bash
cd srv/games/www
npm install    # install dependencies (requires npm registry access)
npm run dev    # start a hot-reloading dev server
npm run build  # create a production build in dist/
```

> If you are working in an offline environment without access to the npm registry, you will need to
> supply the dependencies manually (React 18, ReactDOM 18, prop-types, Vite 5, and
> `@vitejs/plugin-react`).

The build produces both the main arcade landing page (`index.html`) and the fire-crew portal
(`fire/index.html`). Each HTML entry point sets a `data-page` attribute on the `#root` element, which
the shared React bundle reads to load the appropriate configuration and theme.
