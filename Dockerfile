FROM node:20.6.1
WORKDIR /app
COPY COPY serviceaccountkey.tmp.json /app/serviceaccountkey.json
COPY . .
RUN npm install

ARG DB_USER
ARG DB_PASSWORD
ARG DB_HOST
ARG DB_PORT
ARG DB_NAME
ARG jwtSecret
ARG NSFW_MODEL

ENV DB_USER=${DB_USER}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV DB_HOST=${DB_HOST}
ENV DB_PORT=${DB_PORT}
ENV DB_NAME=${DB_NAME}
ENV jwtSecret=${jwtSecret}
ENV NSFW_MODEL=${NSFW_MODEL}

EXPOSE 5000
CMD [ "npm", "run", "start"]
