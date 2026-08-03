# Frontend - Gestor Pro 360
FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY src ./src/
COPY public ./public/

# Expose Parcel dev server port
EXPOSE 1234

# Start Parcel dev server (accessible from outside container)
CMD ["npx", "parcel", "src/index.html", "--port", "1234", "--host", "0.0.0.0"]
