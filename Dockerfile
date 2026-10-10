# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set work directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy project files
COPY . .

# NEXT_PUBLIC_* values are baked into the bundle at build time
# (.env.local is excluded by .dockerignore), so pass the API URL as a build arg:
#   docker build --build-arg NEXT_PUBLIC_FASTAPI_URL=https://api.example.com/api/v1/ .
ARG NEXT_PUBLIC_FASTAPI_URL
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_AWS_IDENTITY_POOL_ID
ENV NEXT_PUBLIC_FASTAPI_URL=${NEXT_PUBLIC_FASTAPI_URL}
ENV NEXT_PUBLIC_AWS_REGION=${NEXT_PUBLIC_AWS_REGION}
ENV NEXT_PUBLIC_AWS_IDENTITY_POOL_ID=${NEXT_PUBLIC_AWS_IDENTITY_POOL_ID}
ENV NODE_ENV=production

# Build the optimized production bundle
RUN npm run build

# Expose port
EXPOSE 3000

# Start the production server
CMD ["npm", "run", "start"]
