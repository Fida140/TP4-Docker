# TP4 : Docker et Docker Compose — application MERN

Containerisation de l'application [MyAppReact](https://github.com/wiem-kb/MyAppReact) :
une API Express (`Server/`), un front React/Vite (`Client/`) et une base MongoDB.

## Structure

```
MyAppReact/
├── Client/
│   ├── Dockerfile
│   └── .dockerignore
├── Server/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/index.mjs      (connexion MongoDB via MONGO_URI)
└── docker-compose.yml
```

## Étapes réalisées

### 1. Cloner le projet

```bash
git clone https://github.com/wiem-kb/MyAppReact.git
cd MyAppReact
```

Deux dossiers : `Client` (React + Vite) et `Server` (API Express).

### 2. Créer les Dockerfiles

**Serveur (`Server/Dockerfile`)** : image `node:lts-alpine`, répertoire de travail `/app`,
copie de `package*.json`, `npm install`, copie du code, port 9000, démarrage avec `npm start`.

Le serveur lit la variable `MONGO_URI` et se connecte à MongoDB avec `mongoose`
(dépendance ajoutée dans `Server/package.json`). La route `/api/health` indique si la base est connectée.

```bash
docker build -t mern-server ./Server
```

**Client (`Client/Dockerfile`)** : image `node:lts-alpine`, copie de `package*.json`,
installation des dépendances, copie du code, `npm run build` (Vite génère `dist/`),
installation de `serve`, port 3000, démarrage avec `serve -s dist -l 3000`.

```bash
docker build -t mern-client ./Client
```

Les fichiers `.dockerignore` empêchent de copier les `node_modules` locaux (Windows) dans l'image.

### 3. Créer un réseau Docker

```bash
docker network create mern-network
```

### 4. Lancer MongoDB

```bash
docker run -d --name mongodb --network mern-network mongo
```

### 5. Lancer le serveur et le client

```bash
docker run -d --name server --network mern-network -p 9000:9000 -e MONGO_URI=mongodb://mongodb:27017/mern mern-server
docker run -d --name client --network mern-network -p 3000:3000 mern-client
```

Sur le réseau `mern-network`, le serveur joint MongoDB par son nom de conteneur : `mongodb`.

Vérification :
- API : http://localhost:9000/api/health → `{"message":"API is running","database":"connected"}`
- Client : http://localhost:3000 → affiche « API is running »

Avant de passer à l'étape 6, supprimer les conteneurs et le réseau créés à la main :

```bash
docker rm -f client server mongodb
docker network rm mern-network
```

### 6. Docker Compose

`docker-compose.yml` définit trois services sur le réseau `mern-network` (driver `bridge`) :

| Service   | Source            | Conteneur | Port | Dépend de |
|-----------|-------------------|-----------|------|-----------|
| `mongodb` | image `mongo`     | mongodb   | —    | —         |
| `server`  | build `./Server`  | server    | 9000 | mongodb   |
| `client`  | build `./Client`  | client    | 3000 | server    |

Le service `server` reçoit `MONGO_URI=mongodb://mongodb:27017/mern`.

```bash
docker compose up --build
```

Arrêt : `docker compose down`

## Remarques

- Les dossiers du dépôt s'appellent `Client` et `Server` (avec une majuscule) ; les commandes
  utilisent donc `./Client` et `./Server`.
- L'énoncé indique `docker build -t mern-server ./client` pour le client : le bon nom d'image est `mern-client`.
- L'énoncé écrit `docker compose up -- build` : la bonne option est `--build` (sans espace).
- Le `package-lock.json` du client a été généré sous Windows et ne contient que le binaire natif
  `win32` de Vite (rolldown). Le Dockerfile client utilise donc `npm install --no-package-lock`,
  sinon `npm run build` échoue dans le conteneur Linux.
- Le front appelle `http://localhost:9000` : c'est le navigateur (sur la machine hôte) qui fait
  l'appel, donc on passe par le port publié 9000 et non par le nom `server`.
