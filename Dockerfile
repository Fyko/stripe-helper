FROM node:12-alpine

LABEL name ""
LABEL version ""
LABEL maintainer ""

WORKDIR /usr/src/stripe-helper

COPY package.json pnpm-lock.yaml ./

ENV PNPM_VERSION=5.1.4

RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
&& curl -L https://unpkg.com/@pnpm/self-installer | node \
&& pnpm config set store-dir ~/.pnpm-store \
&& pnpm install --frozen-lockfile \
&& apk del .build-deps

COPY . .

ENV OWNERS= \
	COLOR= \
	DISCORD_TOKEN= \
	MONGO= \
	PREFIX= \
	STRIPE_API_KEY=

RUN pnpm run build
RUN pnpm prune --prod
CMD ["node", "."]

