# Imagen del backend (Node.js + Express). Node 16 para coincidir con el entorno del proyecto.
FROM node:16-alpine

WORKDIR /app

# Instala solo dependencias de producción (usa package-lock.json).
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el código de la aplicación.
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
