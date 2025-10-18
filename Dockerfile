FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# ci si lockfile, sinon install
RUN if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund --progress=false; \
    else \
    npm install --no-audit --no-fund --progress=false; \
    fi

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate || echo "no prisma schema"
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=deps  /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node","dist/main.js"]