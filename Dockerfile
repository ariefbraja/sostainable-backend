FROM node:20.6.1
WORKDIR /app
COPY . .
RUN npm install

ENV DB_USER=postgres
ENV DB_PASSWORD=sostainablethegoat10
ENV DB_HOST=34.128.116.248
ENV DB_PORT=5432
ENV DB_NAME=sostainable

EXPOSE 5000
CMD [ "npm", "run", "start"]