# --- build ---
FROM node:20-alpine AS build
WORKDIR /app

# 1) deps
COPY package*.json ./
RUN npm ci || npm install

# 2) sources
COPY . .

# 3) s'assurer que "public" existe (même vide)
RUN mkdir -p /app/public

# 4) build Next.js (produit .next ; si output=standalone => .next/standalone)
RUN npm run build

# --- runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# 5) copier le serveur standalone et les assets
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public 

EXPOSE 3000

# IMPORTANT: écoute sur 0.0.0.0 et le $PORT fourni par Render
CMD ["sh", "-c", "next start -H 0.0.0.0 -p ${PORT:-3000}"]