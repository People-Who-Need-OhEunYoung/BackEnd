FROM node:20.14.0

WORKDIR /app

COPY . .

COPY package*.json ./

RUN npm install

ARG PROFILES

ARG ENV

ARG PORT

CMD ["node","app"]