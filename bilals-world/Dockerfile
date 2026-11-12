FROM node:22-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY public ./public
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data UPLOAD_DIR=/data/uploads TRUST_PROXY=1
VOLUME /data
EXPOSE 3000
# the mounted disk belongs to root: give it to the unprivileged "node" user, then drop privileges
CMD ["sh", "-c", "mkdir -p /data/uploads && chown -R node:node /data && exec su-exec node node server/index.js"]
