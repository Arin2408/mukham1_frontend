# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set work directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy project files
COPY . .

# Build the project (uncomment for production)
# RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
