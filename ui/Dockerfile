FROM node:22-alpine AS dependencies
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN npm ci

FROM dependencies AS builder
COPY . .
RUN npm run build --workspace=web

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=builder /workspace /workspace
RUN chmod +x entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
