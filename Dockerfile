# Use the official Node.js image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package.json package.json
COPY package-lock.json package-lock.json

# Install the dependencies
RUN npm install --legacy-peer-deps

# Copy the source code to the container
COPY . .

RUN npm run lint && npm test && npm run build

# Start the server when the container starts
CMD ["npm", "run", "dev"]