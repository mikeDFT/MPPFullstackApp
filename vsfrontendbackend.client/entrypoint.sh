#!/bin/sh

# Substitute environment variables in nginx.conf.template and output to nginx.conf
envsubst '${SERVER_IP} ${SERVER_HTTP_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
nginx -g 'daemon off;'
