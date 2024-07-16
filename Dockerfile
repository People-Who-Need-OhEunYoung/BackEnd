FROM node:20.14.0

WORKDIR /app

COPY . .

COPY package*.json ./

RUN npm install 

RUN apt-get update
RUN apt-get install -y mysql-client

ARG PROFILES

ARG ENV

ARG PORT

CMD ["node","app"]