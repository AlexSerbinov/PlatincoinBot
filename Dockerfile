FROM node:12
RUN mkdir -p /home/user-dev/platincoin/PlatincoinBot && chown -R node:node /home/user-dev/platincoin/PlatincoinBot
WORKDIR /home/user-dev/platincoin/PlatincoinBot
COPY package*.json ./
USER node
RUN npm install
COPY --chown=root:root . .
CMD [ "npm", "start" ]