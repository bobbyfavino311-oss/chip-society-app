FROM node:24-alpine
WORKDIR /app
# Copy only the pre-built ESM bundle (all deps inlined by esbuild)
COPY artifacts/api-server/dist/index.mjs ./dist/index.mjs
COPY artifacts/api-server/dist/index.mjs.map ./dist/index.mjs.map
COPY artifacts/api-server/dist/pino-worker.mjs ./dist/pino-worker.mjs
COPY artifacts/api-server/dist/pino-file.mjs ./dist/pino-file.mjs
COPY artifacts/api-server/dist/pino-pretty.mjs ./dist/pino-pretty.mjs
COPY artifacts/api-server/dist/thread-stream-worker.mjs ./dist/thread-stream-worker.mjs
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/index.mjs"]

# deploy trigger
