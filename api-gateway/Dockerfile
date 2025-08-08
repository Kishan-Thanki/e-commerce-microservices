# api-gateway/Dockerfile
FROM nginx:latest

RUN rm /etc/nginx/conf.d/default.conf

COPY ./api-gateway/nginx.conf /etc/nginx/conf.d/default.conf

COPY ./frontend /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]