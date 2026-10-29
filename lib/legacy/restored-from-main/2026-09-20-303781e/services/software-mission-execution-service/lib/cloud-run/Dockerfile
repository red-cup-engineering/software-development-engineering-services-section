FROM node:22.18-bookworm-slim
COPY --chown=node:node lib /app/lib
WORKDIR /app/lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-code-services-section/services/computer-code-development-services-section/services/software-mission-execution-service
RUN npm install -g npm@11 && rm -f package-lock.json && npm install --omit=dev --install-links && npm cache clean --force && node --check scripts/serve-activitypub-cloud-event.mjs
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0
USER node
EXPOSE 8080
CMD ["node", "scripts/serve-activitypub-cloud-event.mjs"]
