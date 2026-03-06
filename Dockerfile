FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build tools for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# Copy package.json files first for dependency install
COPY package*.json ./

# Install dependencies inside container (Node 20)
RUN npm install

# Copy rest of the application code
COPY . .

# Expose port
EXPOSE 5000

# Default command for dev
# CMD ["npm", "run", "dev"]