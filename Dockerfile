FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

COPY src ./src
EXPOSE 3000

HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1

CMD ["npm", "start"]
