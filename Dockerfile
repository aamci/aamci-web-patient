# --- build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install
COPY . .

# Build Next.js app
RUN npm run build

# --- runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copie des fichiers nécessaires au runtime Next.js
# (Next 13+ avec output=standalone génère .next/standalone)
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# Le dossier public est optionnel
RUN mkdir -p ./public
COPY --from=build /app/public ./public 2>/dev/null || true

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]