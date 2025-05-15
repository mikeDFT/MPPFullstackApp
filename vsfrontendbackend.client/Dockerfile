# Stage 1: Build the React application
FROM node:20 AS build
WORKDIR /app

# copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# install dependencies from package.json
RUN npm install --production=false

# copy the rest of the application code
COPY . .

# Use Azure config if deploying to Azure
RUN if [ "$AZURE_DEPLOYMENT" = "true" ]; then \
      cp src/config.azure.js src/config.js; \
    fi

# Set environment variables to disable HTTPS and set NODE_ENV
ENV NODE_ENV=production
ENV HTTPS=false
ENV VITE_SERVER_PORT=8080

# build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# remove default Nginx static assets
RUN rm -rf ./*

# copy static assets from builder stage
COPY --from=build /app/dist .

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set file permission
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]