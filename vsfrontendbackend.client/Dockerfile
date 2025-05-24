# Stage 1: Build the React application
FROM node:20 AS build

# ARG for build-time environment variables passed by ACR Task --set
# Defaulting VITE_SERVER_IP_ARG to an empty string or a placeholder for Azure builds,
# as the client should make relative API calls.
ARG VITE_SERVER_IP_ARG=""
ARG VITE_SERVER_HTTP_PORT_ARG=8080
ARG AZURE_DEPLOYMENT_ARG=false # Default to false

WORKDIR /app

# Set ENV vars for the build process so Vite can pick them up
# These ENV vars are used by the RUN npm run build step
ENV VITE_SERVER_IP=$VITE_SERVER_IP_ARG
ENV VITE_SERVER_HTTP_PORT=$VITE_SERVER_HTTP_PORT_ARG
ENV NODE_ENV=production
ENV HTTPS=false
# This AZURE_DEPLOYMENT env var is used by the RUN if [...] step below
ENV AZURE_DEPLOYMENT=$AZURE_DEPLOYMENT_ARG

# copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# install dependencies using npm ci for cleaner installs if package-lock.json exists
# Otherwise, fall back to npm install. This will install devDependencies including Vite.
# RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
RUN npm install

# Add node_modules/.bin to the PATH to ensure vite command is found
ENV PATH /app/node_modules/.bin:$PATH

# For debugging: list contents of node_modules/.bin to verify vite is there
RUN ls -la /app/node_modules/.bin || echo "node_modules/.bin not found or empty"

# copy the rest of the application code (including vite.config.js)
COPY . .

# Use Azure config if deploying to Azure
# Ensure comparison handles string "true"
RUN echo "AZURE_DEPLOYMENT build-time value: $AZURE_DEPLOYMENT" && \
    if [ "$AZURE_DEPLOYMENT" = "true" ] || [ "$AZURE_DEPLOYMENT" = "True" ]; then \
      echo "Using Azure config (src/config.azure.js -> src/config.js)"; \
      cp src/config.azure.js src/config.js; \
    else \
      echo "Using default config (src/config.js)"; \
    fi

# build the application using the script defined in package.json
# This ensures the project's version of Vite is used.
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# remove default Nginx static assets
RUN rm -rf ./*

# copy static assets from builder stage
COPY --from=build /app/dist .

# Copy Nginx configuration template and the entrypoint script
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set file permission for static assets
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Run the entrypoint script, which will configure Nginx from the template and then start Nginx
ENTRYPOINT ["/entrypoint.sh"]