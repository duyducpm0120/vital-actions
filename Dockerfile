# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create .env file from example if it doesn't exist
RUN if [ ! -f .env ]; then cp .env.example .env; fi

# Expose port if needed (for future use)
# EXPOSE 3000

# Start the bot
CMD ["npm", "start"] 