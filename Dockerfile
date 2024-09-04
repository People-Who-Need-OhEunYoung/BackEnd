FROM node:20.14.0

WORKDIR /app

COPY . .

COPY package*.json ./

RUN npm install 

RUN apt-get update
RUN apt-get install -y default-mysql-client
RUN apt-get install -y jq
RUN apt-get install -y curl

ARG PROFILES

ARG ENV

ARG PORT

CMD ["node","app"]