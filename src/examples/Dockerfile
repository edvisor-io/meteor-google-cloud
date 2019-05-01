FROM gcr.io/google_appengine/nodejs
RUN install_node {{ nodeVersion }}
RUN npm install npm@{{ npmVersion }}
RUN node -v
RUN npm -v
COPY . /app/
RUN (cd programs/server && npm install --unsafe-perm)
CMD node main.js
