FROM oven/bun:alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json .
COPY ./src ./src

RUN bun run build



FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/dist ./dist

CMD ["bun", "dist/main.js"]
