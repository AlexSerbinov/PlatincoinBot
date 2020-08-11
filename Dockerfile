FROM node:10
RUN mkdir -p /home/node/PlatincoinBot && chown -R node:node /home/node/PlatincoinBot
WORKDIR /home/node/PlatincoinBot
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
CMD [ "npm", "start" ]