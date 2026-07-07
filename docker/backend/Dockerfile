FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN npm run build 2>/dev/null || true

EXPOSE 3001

CMD ["node", "dist/index.js"]
