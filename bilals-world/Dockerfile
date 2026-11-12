FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY public ./public
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data UPLOAD_DIR=/data/uploads TRUST_PROXY=1
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "server/index.js"]
