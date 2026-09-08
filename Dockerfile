FROM node:22-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime

ARG BUILD_VERSION=1.0.0
ARG COMMIT_SHA=unknown

ENV NODE_ENV=production \
    PORT=3000 \
    APP_ENV=argocd-test \
    BUILD_VERSION=${BUILD_VERSION} \
    COMMIT_SHA=${COMMIT_SHA}

WORKDIR /app

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./package.json
COPY --chown=node:node src ./src

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]

