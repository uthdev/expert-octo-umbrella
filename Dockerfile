FROM node:18-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5111

CMD ["node", "index.js"]
