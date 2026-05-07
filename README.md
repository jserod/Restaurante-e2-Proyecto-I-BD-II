# Restaurante E2 - Sistema de Gestion de Restaurantes

## Arquitectura Profesional con CI/CD, Sharding, ElasticSearch y Escalabilidad

Sistema distribuido para la gestion de restaurantes, reservas, menus, productos y pedidos. Implementa arquitectura de microservicios con soporte dual PostgreSQL/MongoDB, replicacion y sharding en MongoDB, busqueda full-text con ElasticSearch, cacheo con Redis, balanceo de carga con Nginx y pipeline CI/CD completo.

---

## Tabla de Contenidos

- [Caracteristicas](#caracteristicas)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalacion](#instalacion)
- [Configuracion](#configuracion)
- [Uso](#uso)
- [Cambio de Base de Datos](#cambio-de-base-de-datos)
- [Escalabilidad](#escalabilidad)
- [Tests](#tests)
- [CICD](#cicd)
- [Generacion de Datos con LLM](#generacion-de-datos-con-llm)
- [Endpoints](#endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologias](#tecnologias)
- [Autores](#autores)

---

## Caracteristicas

| Caracteristica | Descripcion |
|---|---|
| **Dual DB** | Cambio en iniciación entre PostgreSQL y MongoDB sin modificar codigo |
| **MongoDB Sharding** | Cluster con replica set (1 primario, 2 secundarios) + shard  |
| **ElasticSearch** | Microservicio independiente de busqueda por texto con reindexacion |
| **Redis Cache** | Cacheo de respuestas frecuentes con politicas de expiracion |
| **Balanceador Nginx** | Enrutamiento `/api/**` y `/search/**` con distribucion de carga |
| **CICD** | Pipeline GitHub Actions: tests -> build -> push to GHCR (GitHub Container Registry)|
| **Escalabilidad** | Escalado horizontal con Docker Compose y Kubernetes |
| **Auth** | JWT via Keycloak con roles `admin` y `user` |

---

## Arquitectura

```
+-------------------------------------------------------------+
|                         CLIENTE                             |
|              (Browser / Postman / Swagger)                  |
+----------------------+--------------------------------------+
                       |
                       v
+-------------------------------------------------------------+
|                    NGINX (Puerto 80)                        |
|              Balanceador de Carga + Gateway                 |
|         /api/* ----> api_servers (least_conn)               |
|       /search/* ----> search_servers (least_conn)           |
+----------------------+--------------------------------------+
                       |
           +-----------+-----------+
           v                       v
+---------------------+   +---------------------+
|   API Service       |   |   Search Service    |
|   (Puerto 3000)     |   |   (Puerto 3001)     |
|   Replicas: N       |   |   Replicas: N       |
+---------+-----------+   +---------+-----------+
          |                         |
          v                         v
+-----------------+         +-----------------+
|  PostgreSQL     |         |  ElasticSearch  |
|  (Puerto 5432)  |         |  (Puerto 9200)  |
+-----------------+         +-----------------+
          |                         ^
          v                         |
+-----------------+         +-----------------+
|  MongoDB Router |         |     Redis       |
|  (Puerto 27017) |         |  (Puerto 6379)  |
|  + Sharding     |         |     (Cache)     |
+-----------------+         +-----------------+
          |
          v
+-----------------------------------------+
|         MongoDB Sharded Cluster         |
|  +---------+    +-----------------+     |
|  | Config  |<---|  Config Servers |     |
|  | Servers |    |  (3 replicas)   |     |
|  | (3)     |    +-----------------+     |
|  +----+----+                            |
|       |                                 |
|       v                                 |
|  +---------+    +-----------------+     |
|  |  mongos |<---|  Shard 1        |     |
|  | (Router)|    |  (3 replicas)   |     |
|  +---------+    +-----------------+     |
+-----------------------------------------+
          |
          v
+-----------------+
|    Keycloak     |
|  (Puerto 8080)  |
|   Auth JWT      |
+-----------------+
```

---

## Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (con Docker Compose)
- [Node.js](https://nodejs.org/)
- [Ollama](https://ollama.com/) (opcional, para generación de datos con LLM)

---

## Instalacion

### 1. Configurar variables de entorno

Crear archivo `.env` en la raiz:

```env
PORT=3000
SEARCH_PORT=3001
POSTGRES_EXTERNAL_PORT=5432

DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=restaurant
DB_TYPE=postgres
DB_HOST=localhost
MONGO_URI=mongodb://mongo-router:27017
MONGO_DB_NAME=restaurant

KEYCLOAK_PORT=8080
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=restaurant-realm
KEYCLOAK_CLIENT_ID=restaurant-api
KEYCLOAK_CLIENT_SECRET=vtKM5Zuios5Lrdp1bqKvt6P8cKT1OVjf

OLLAMA_MODEL=llama3.2

GITHUB_REPOSITORY=jserod/restaurante-e2-proyecto-i-bd-ii
```

### 2. Levantar la infraestructura

Viene con un script para iniciar Docker y Kubernetes, en powershell correr:
```bash
# Levantar todos los servicios
./script/start.ps1

#otra opcion
docker compose up --scale api=3 --scale search-service=2

```

---

## Configuracion

### Keycloak

Una vez que Keycloak este corriendo en `http://localhost:8080`:

1. Iniciar sesion con `admin` / `admin`
2. El realm `restaurant-realm` ya esta importado desde `keycloak/realm-export.json`
3. El Client Secret ya esta configurado en el `.env`
4. Asegurarse que que el realm seleccionado sea `restaurant-realm`

### MongoDB Sharding

El sharding se inicializa automaticamente via el contenedor `mongo-init`. Verificar:

```bash
docker logs mongo-init
```

---

## Uso

### Documentacion Swagger

| Servicio | URL |
|----------|-----|
| API Principal | http://localhost/api/docs/ |
| Search Service | http://localhost/search/docs/ |

### Acceder a la API

1. Registrar usuario: `POST /api/auth/register`
2. Login: `POST /api/auth/login` -> obtener token JWT
3. Autorizar en Swagger con: `Bearer <token>`

---

## Cambio de Base de Datos

El sistema permite cambiar entre PostgreSQL y MongoDB (al inicio, no durante ejecución) **sin modificar codigo fuente**, solo cambiando la variable `DB_TYPE`.

### Usar PostgreSQL 

```env
DB_TYPE=postgres
```

### Usar MongoDB

```env
DB_TYPE=mongo
```

### Arquitectura DAO

La seleccion de base de datos se realiza mediante el patron **Factory** en `src/dao/DAOFactory.js`:

```javascript
const DAOFactory = require('./src/dao/DAOFactory')

// DB_TYPE determina automaticamente que implementacion usar
// Postgres o Mongo
const userDAO = DAOFactory.getUserDAO()      
const menuDAO = DAOFactory.getMenuDAO()      
const RestaurantDAO = DAOFactory.getRestaurantDAO()        
const orderDAO = DAOFactory.getOrderDAO()                  
const ReservationDAO = DAOFactory.getReservationDAO()      
const productDAO = DAOFactory.getProductDAO()              
```

---

## Escalabilidad

### Docker Compose

```bash
# Escalar horizontalmente

# Verificar distribucion de carga
curl http://localhost/_host
curl http://localhost/search/_host
```

## Tests

### Ejecutar tests localmente

```bash
cd microservices/api
npm install
npm test 
```

### Tests del Search Service

```bash
cd microservices/search
npm install
npm test 
```

### Cobertura

| Tipo | Cobertura |
|---|---|
| Lineas | > 90% |
| Funciones | > 90% |
| Branches | > 90% |

---

## CICD

Pipeline GitHub Actions (`.github/workflows/ci.yml`):

```
Push/PR ---> Tests (unit + integration) ---> Build Images ---> Push to GHCR
                |                              |
                v                              v
         PostgreSQL + MongoDB           api:latest
         + Redis + ElasticSearch        search:latest
```

---

## Generacion de Datos con LLM

Requiere [Ollama](https://ollama.com/) con modelo `llama3.2`:

```bash
# Terminal 1: Iniciar Ollama
ollama serve

# Terminal 2: Ejecutar generador
cd microservices/api
npm install
$env:DB_TYPE="postgres" || $env:DB_TYPE="mongo"
$env:OLLAMA_MODEL="llama3.2"
node tests/generateDataLLM.js
```

Genera automaticamente:
- 5 restaurantes costarricenses realistas
- 3 menus por restaurante
- 4 productos por menu
- Insercion directa en PostgreSQL o MongoDB

---

## Endpoints

### API Principal (`/api`)

| Recurso | Metodos | Descripcion |
|---|---|---|
| `/auth/register` | POST | Registro de usuario |
| `/auth/login` | POST | Login y obtencion de JWT |
| `/users` | GET, PUT, DELETE | Gestion de usuarios |
| `/restaurants` | GET, POST, PUT, DELETE | Restaurantes |
| `/menus` | GET, POST, PUT, DELETE | Menus |
| `/products` | GET, POST, PUT, DELETE | Productos |
| `/reservations` | GET, POST, PUT, DELETE | Reservas |
| `/orders` | GET, POST, PUT, DELETE | Pedidos |

### Search Service (`/search`)

| Endpoint | Descripcion |
|---|---|
| `GET /search/products?q=texto` | Busqueda textual en productos |
| `GET /search/products/category/:categoria` | Filtrar por categoria |
| `POST /search/reindex` | Reindexar productos manualmente |

---

## Estructura del Proyecto

```
Restaurante-e2-Proyecto-I-BD-II/
├── .github/workflows/ci.yml      # Pipeline CI/CD
├── docker-compose.yml            # Orquestacion completa
├── .env                          # Variables de entorno
├── nginx/
│   └── nginx.conf                # Configuracion del balanceador
├── mongo/
│   └── init.sh                   # Inicializacion de sharding
├── keycloak/
│   └── realm-export.json         # Configuracion de Keycloak
├── k8s/                          # Manifests de Kubernetes
│   ├── namespace.yml
│   ├── configmap.yml
│   ├── secrets.yml
│   ├── api-deployment.yml
│   ├── api-service.yml
│   ├── search-deployment.yml
│   ├── search-service.yml
│   ├── nginx-deployment.yml
│   └── nginx-service.yml
├── microservices/
│   ├── api/                        # Microservicio principal
│   │   ├── src/
│   │   │   ├── config/             # DB, Keycloak, Redis, Swagger
│   │   │   ├── controllers/        # Logica de negocio
│   │   │   ├── dao/                # Patron DAO (Postgres + Mongo)
│   |   │   │    ├── interfaces/
│   |   │   │    ├── postgres/
│   |   │   │    ├── mongo/
│   |   │   │    └── FAOFactory.js
│   │   │   ├── middlewares/        # Auth, cache, roles
│   │   │   ├── routes/             # Definicion de endpoints
│   │   │   ├── services/           # Logica de servicios
│   │   │   ├── app.js            
│   │   │   └── server.js         
│   │   ├── tests/                  # Tests unitarios e integracion
│   │   │   ├── helpers/
│   │   │   ├── unit/
│   │   │   ├── integration/ 
│   │   |   └── generateDataLLM.js  # Generador de datos con Ollama
│   │   ├── Dockerfile
│   │   └── package.json
│   └── search/                     # Microservicio de busqueda
│       ├── src/
│       │   ├── searchController.js
│       │   ├── searchRoutes.js
│       │   ├── productDataSource.js
│       │   └── config/
│       ├── tests/
│       │   ├── helpers/
│       │   ├── unit/
│       │   └── integration/ 
│       ├── Dockerfile
│       └── package.json
└── scripts/
    ├── start.ps1                   # Script de inicio
    ├── stop.ps1                    # Script de detencion
    └── cacheValidate.ps1           # Validacion de cache
```

---

## Tecnologias

| Capa | Tecnologia |
|---|---|
| **Backend** | Node.js, Express.js |
| **Bases de Datos** | PostgreSQL, MongoDB (Sharded) |
| **Busqueda** | ElasticSearch |
| **Cache** | Redis |
| **Auth** | Keycloak |
| **Balanceador** | Nginx |
| **Contenedores** | Docker, Docker Compose |
| **Orquestacion** | Kubernetes |
| **CICD** | GitHub Actions |
| **Tests** | Jest, Supertest |
| **Docs** | Swagger/OpenAPI |
| **LLM** | Ollama (Llama 3.2) |

---

## Autores

- **Josué Rodríguez** - [@jserod](https://github.com/jserod)

---

## Licencia

Este proyecto es parte del curso de Bases de Datos II, Instituto Tecnológico de Costa Rica.