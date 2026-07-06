FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

RUN npm run build || true

EXPOSE 3001

CMD ["node", "dist/index.js"]
