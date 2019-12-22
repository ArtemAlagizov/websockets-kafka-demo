# ------ build container ------
FROM node:alpine as react-build

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN yarn
COPY . .
RUN yarn build

# ------ run container ------
FROM nginx:alpine

# nginx config
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx

# static build
COPY --from=react-build /app/build /usr/share/nginx/html

# default port exposure
EXPOSE 80

# initialize environment variables into filesystem
WORKDIR /usr/share/nginx/html
COPY ./env.sh .
COPY .env .

# add bash
RUN apk add --no-cache bash

# run script which initializes env vars to fs
RUN chmod +x env.sh