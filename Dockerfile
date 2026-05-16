FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tzdata
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY tsconfig.json ./
COPY package.json ./
VOLUME ["/app/.data"]
EXPOSE 8787
CMD ["npm", "start"]
