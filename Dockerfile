FROM node:10
# RUN mkdir -p /home/alex/PlatincoinBot && chown -R node:node /home/node/app
WORKDIR /home/alex/PlatincoinBot/
COPY package*.json ./
USER alex
RUN npm install
# COPY --chown=node:node . .
CMD [ "npm", "start" ]