FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY prisma ./prisma
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN yarn prisma generate && yarn build

FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=8000

COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
# prisma CLI é devDependency, mas é necessário para `migrate deploy` no start
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma

EXPOSE 8000

CMD ["sh", "-c", "yarn prisma migrate deploy && node dist/main"]
