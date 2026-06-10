# Use official Node.js alpine image as the base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy the rest of the backend source code
COPY . .

# Expose the API port
EXPOSE 5000

# Set environment variables for production
ENV NODE_ENV=production

# Command to start the server
CMD ["node", "server.js"]
