# ── Stage 1: install all deps (including dev) for building ────────────────────
# --frozen-lockfile is omitted: yarn still reads yarn.lock for version pinning
# but can update it if package.json has changed since the last `yarn install`.
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package.json yarn.lock* ./
RUN yarn install --non-interactive

# ── Stage 2: compile TypeScript ───────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN yarn build

# ── Stage 3: production-only deps (no devDependencies) ───────────────────────
# --frozen-lockfile is intentionally omitted: Yarn 1 needs to write a
# production-only subset of the lockfile, which --frozen-lockfile blocks.
FROM node:20-alpine AS prod-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock* ./
RUN yarn install --non-interactive --production

# ── Stage 4: lean runtime image ───────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV CLAUDYGOD_ENV=production
ENV API_PORT=4000
COPY --chown=node:node --from=build      /usr/src/app/dist        ./dist
COPY --chown=node:node --from=build      /usr/src/app/src/assets  ./src/assets
COPY --chown=node:node --from=prod-deps  /usr/src/app/node_modules ./node_modules
COPY --chown=node:node package.json ./
RUN mkdir -p /usr/src/app/logs && chown node:node /usr/src/app/logs
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
USER node
CMD ["node", "dist/index.js"]
