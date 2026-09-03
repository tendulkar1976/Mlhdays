FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src/

EXPOSE 3002

ENV PORT=3002
ENV TAX_ENGINE_URL=http://tax-engine:3000

CMD ["npm", "start"]
