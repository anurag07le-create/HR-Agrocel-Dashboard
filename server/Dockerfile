FROM node:20-alpine

WORKDIR /app

# Copy server files
COPY server/ ./server/
WORKDIR /app/server

# Create empty triggered_calls.json if it doesn't exist
RUN echo '{}' > triggered_calls.json

# Install dependencies
RUN npm ci --only=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the scheduler
CMD ["npm", "start"]
