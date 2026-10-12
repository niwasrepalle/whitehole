FROM node:24-alpine
WORKDIR /app
COPY server ./server
COPY src/icons.js ./src/icons.js
COPY package.json ./package.json
ENV PORT=8787 HOST=0.0.0.0
EXPOSE 8787
USER node
CMD ["node", "server/icons.mjs"]
