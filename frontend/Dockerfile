FROM node:20-slim

LABEL maintainer="CQT Light Team"
LABEL description="CQT Light Frontend — React/Vite (modo web, sem Electron)"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
