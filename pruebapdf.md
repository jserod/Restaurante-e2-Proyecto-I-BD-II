Documentacion Tecnica del Sistema - Restaurante E2
Etapa 2: Arquitectura Profesional con CI/CD, Sharding, ElasticSearch y Escalabilidad
1. Portada
Universidad [Nombre de la Universidad]
Curso: Bases de Datos II
Proyecto: Restaurante E2 - Sistema de Gestion de Restaurantes
Integrantes:
Jose Rodriguez (@jserod)
Fecha: Mayo 2026
2. Tabla de Contenidos
Introduccion
Objetivos
Arquitectura del Sistema
3.1 Arquitectura Logica
3.2 Arquitectura Fisica
Microservicios
4.1 API Principal
4.2 Search Service
Flujo de Datos
Capa de Persistencia
6.1 PostgreSQL
6.2 MongoDB con Sharding
6.3 Patron DAO y Factory
Cache con Redis
Busqueda con ElasticSearch
Balanceador de Carga (Nginx)
CI/CD Pipeline
Escalabilidad y Kubernetes
Seguridad
Conclusiones
3. Introduccion
El presente documento describe el diseno e implementacion de una arquitectura profesional para un sistema de gestion de restaurantes. Esta segunda etapa del proyecto extiende la API inicial con componentes de infraestructura empresarial: pipeline CI/CD, replicacion y sharding en MongoDB, servidor de busqueda con ElasticSearch, balanceador de carga, cacheo con Redis, pruebas automatizadas con cobertura del 90%, y la posibilidad de escalado horizontal mediante Kubernetes.
El sistema opera con dos motores de base de datos (PostgreSQL y MongoDB) de forma configurable sin modificar el codigo fuente, utilizando el patron de diseno Factory para la seleccion dinamica de implementaciones DAO.
4. Objetivos
Table
Objetivo	Estado
Implementar pipeline CI/CD con GitHub Actions	Completado
Configurar MongoDB con replica set y sharding	Completado
Compatibilidad dual PostgreSQL/MongoDB	Completado
Microservicio de busqueda con ElasticSearch	Completado
Cacheo de respuestas con Redis	Completado
Balanceador de carga con Nginx	Completado
Pruebas unitarias e integracion con >90% cobertura	Completado
Escalabilidad horizontal con Docker Compose y Kubernetes	Completado
Generacion de datos de prueba con LLM	Completado
5. Arquitectura del Sistema
5.1 Arquitectura Logica
La arquitectura logica del sistema sigue un modelo de microservicios con las siguientes capas:
plain
Copy
+-------------------+     +-------------------+     +-------------------+
|   Capa de         |     |   Capa de         |     |   Capa de         |
|   Presentacion    |     |   Aplicacion      |     |   Datos           |
|                   |     |                   |     |                   |
| - Swagger UI      |     | - API Service     |     | - PostgreSQL      |
| - Clientes HTTP   |     | - Search Service  |     | - MongoDB         |
|                   |     | - Auth (Keycloak) |     | - ElasticSearch   |
|                   |     | - Cache (Redis)   |     | - Redis           |
+-------------------+     +-------------------+     +-------------------+
         |                         |                         |
         v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|   Gateway         |     |   Logica de       |     |   Persistencia    |
|   (Nginx)         |     |   Negocio         |     |   (DAO Pattern)   |
|                   |     |   (Controllers +  |     |                   |
| - Routing         |     |    Services)      |     | - UserDAO         |
| - Load Balancing  |     |                   |     | - RestaurantDAO   |
| - SSL Termination |     | - Users           |     | - MenuDAO         |
|                   |     | - Restaurants     |     | - ProductDAO      |
|                   |     | - Menus           |     | - ReservationDAO  |
|                   |     | - Reservations    |     | - OrderDAO        |
|                   |     | - Orders          |     |                   |
+-------------------+     +-------------------+     +-------------------+
5.2 Arquitectura Fisica
La arquitectura fisica se implementa mediante contenedores Docker orquestados con Docker Compose:
plain
Copy
+------------------------------------------------------------------+
|                         HOST (localhost)                         |
|                                                                  |
|  +-------------------+        +-------------------------------+  |
|  |  Nginx            |        |  Docker Network (bridge)      |  |
|  |  Puerto 80        |------->|                               |  |
|  |  Balanceador      |        |  +-------------------------+  |  |
|  +-------------------+        |  | API Service (xN)        |  |  |
|                               |  | Puerto 3000             |  |  |
|                               |  +-------------------------+  |  |
|                               |           |                   |  |
|                               |  +--------v-----------+       |  |
|                               |  | Search Service (xN)|       |  |
|                               |  | Puerto 3001        |       |  |
|                               |  +--------------------+       |  |
|                               |           |                   |  |
|                               |  +--------v-----------+       |  |
|                               |  | Keycloak           |       |  |
|                               |  | Puerto 8080        |       |  |
|                               |  +--------------------+       |  |
|                               |           |                   |  |
|                               |  +--------v-----------+       |  |
|                               |  | Redis              |       |  |
|                               |  | Puerto 6379        |       |  |
|                               |  +--------------------+       |  |
|                               |           |                   |  |
|                               |  +--------v-----------+       |  |
|                               |  | PostgreSQL         |       |  |
|                               |  | Puerto 5432        |       |  |
|                               |  +--------------------+       |  |
|                               |           |                   |  |
|                               |  +--------v-----------+       |  |
|                               |  | ElasticSearch      |       |  |
|                               |  | Puerto 9200        |       |  |
|                               |  +--------------------+       |  |
|                               |           |                   |  |
|                               |  +--------v-----------+       |  |
|                               |  | MongoDB Cluster    |       |  |
|                               |  | - Config Servers   |       |  |
|                               |  | - Shard (3 nodes)  |       |  |
|                               |  | - Router (mongos)  |       |  |
|                               |  | Puerto 27017       |       |  |
|                               |  +--------------------+       |  |
|                               +-------------------------------+  |
+------------------------------------------------------------------+
6. Microservicios
6.1 API Principal
Table
Aspecto	Descripcion
Responsabilidad	Gestion completa del dominio de negocio: usuarios, restaurantes, menus, productos, reservas y pedidos
Tecnologia	Node.js 20 + Express.js
Puerto	3000
Base de datos	PostgreSQL (default) o MongoDB (configurable)
Autenticacion	JWT via Keycloak
Cache	Redis para respuestas GET frecuentes
Documentacion	Swagger/OpenAPI en /api/docs
Endpoints principales:
/api/auth/* - Autenticacion (register, login)
/api/users/* - Gestion de usuarios
/api/restaurants/* - CRUD de restaurantes
/api/menus/* - CRUD de menus
/api/products/* - CRUD de productos
/api/reservations/* - CRUD de reservas
/api/orders/* - CRUD de pedidos
6.2 Search Service
Table
Aspecto	Descripcion
Responsabilidad	Busqueda full-text de productos por nombre, categoria y descripcion
Tecnologia	Node.js 20 + Express.js + ElasticSearch client
Puerto	3001
Base de datos	ElasticSearch
Cache	Redis para resultados de busqueda
Documentacion	Swagger/OpenAPI en /search/docs
Endpoints:
GET /search/products?q=texto - Busqueda textual
GET /search/products/category/:categoria - Filtrado por categoria
POST /search/reindex - Reindexacion manual desde PostgreSQL/MongoDB
Flujo de reindexacion:
El Search Service consulta todos los productos de la base de datos principal
Indexa cada producto en ElasticSearch con campos: name, category, description
Si un producto no tiene descripcion, se usa "Producto sin descripcion" por defecto
7. Flujo de Datos
7.1 Flujo de una peticion tipica (GET /api/restaurants)
plain
Copy
1. Cliente ----> Nginx:80
                  |
2. Nginx --------> API Service:3000 (least_conn)
                    |
3. API Service ----> Redis (verifica cache)
                      |
                      +-- Cache HIT --> Retorna respuesta
                      |
                      +-- Cache MISS --> Continua
                            |
4. API Service --------> DAOFactory.getRestaurantDAO()
                              |
                              +-- DB_TYPE=postgres --> RestaurantPostgresDAO
                              +-- DB_TYPE=mongo --> RestaurantMongoDAO
                                    |
5. DAO ----------------> PostgreSQL / MongoDB
                              |
6. DAO ----------------> API Service (datos)
                              |
7. API Service --------> Redis (guarda en cache con TTL)
                              |
8. API Service --------> Nginx --------> Cliente
7.2 Flujo de busqueda (GET /search/products?q=pizza)
plain
Copy
1. Cliente ----> Nginx:80 /search/products?q=pizza
                  |
2. Nginx --------> Search Service:3001 (least_conn)
                    |
3. Search Service -> Redis (verifica cache de busqueda)
                      |
                      +-- Cache HIT --> Retorna resultados
                      |
                      +-- Cache MISS --> Continua
                            |
4. Search Service ---> ElasticSearch:9200
                            |
5. ElasticSearch ---> Search Service (resultados)
                            |
6. Search Service ---> Redis (guarda resultados con TTL)
                            |
7. Search Service ---> Nginx --------> Cliente
7.3 Flujo de autenticacion
plain
Copy
1. Cliente ----> POST /api/auth/login {username, password}
                  |
2. API Service --> Keycloak:8080 (validacion de credenciales)
                  |
3. Keycloak -----> API Service (JWT token)
                  |
4. API Service ---> Cliente (token + refresh token)
                  |
5. Cliente -----> API con Header: Authorization: Bearer <token>
                  |
6. API Service ---> Keycloak (validacion de token)
                  |
7. Keycloak -----> API Service (token valido + roles)
                  |
8. API Service ---> attachUser middleware (inyecta usuario en req)
                  |
9. requireRole middleware (verifica roles permitidos)
                  |
10. Controller ---> Service ---> DAO ---> DB
8. Capa de Persistencia
8.1 PostgreSQL
Se utiliza como base de datos relacional principal. Esquema gestionado mediante scripts de inicializacion en src/database/initPostgres.js.
Tablas principales:
users (id, keycloak_id, email, name, roles, created_at)
restaurants (id, name, description, address, phone, email, category, rating)
menus (id, restaurant_id, name, description, price, category)
products (id, restaurant_id, name, description, price, category, tags)
reservations (id, user_id, restaurant_id, reservation_date, party_size, status, notes)
orders (id, user_id, restaurant_id, items, total, status, delivery_address, notes)
8.2 MongoDB con Sharding
Se utiliza como base de datos NoSQL alternativa. Configuracion de sharding para distribuir datos de productos y reservas.
Componentes del cluster:
Table
Componente	Cantidad	Rol	Puerto
Config Servers	3	Almacenan metadatos del cluster	27019
Shard 1	3 (1 primario, 2 secundarios)	Almacenan datos particionados	27018
Router (mongos)	1	Punto de entrada para aplicaciones	27017
Colecciones shardeadas:
Table
Coleccion	Clave de Shard	Tipo
menus	restaurant_id	Hashed
reservations	user_id	Hashed
orders	user_id	Hashed
restaurants	_id	Hashed
users	keycloak_id	Hashed
Inicializacion automatica:
El contenedor mongo-init ejecuta el script mongo/init.sh que:
Inicializa el replica set de config servers
Inicializa el replica set del shard
Agrega el shard al router
Habilita sharding en la base de datos restaurant
Define las colecciones shardeadas con sus claves
8.3 Patron DAO y Factory
El patron Data Access Object (DAO) abstrae el acceso a la base de datos, permitiendo cambiar entre PostgreSQL y MongoDB sin modificar la logica de negocio.
plain
Copy
+-------------------+     +-------------------+     +-------------------+
|   Controller      |---->|   Service         |---->|   DAOFactory      |
|   (Negocio)       |     |   (Logica)        |     |   (Factory)       |
+-------------------+     +-------------------+     +---------+---------+
                                                               |
                                          +--------------------+--------------------+
                                          |                                         |
                                          v                                         v
                                    +-------------+                         +-------------+
                                    |  Postgres   |                         |   Mongo     |
                                    |  Implement. |                         |  Implement. |
                                    +-------------+                         +-------------+
Ejemplo de uso:
JavaScript
Copy
const DAOFactory = require('./src/dao/DAOFactory')

// La implementacion concreta se determina por DB_TYPE
const restaurantDAO = DAOFactory.getRestaurantDAO()

// Mismo metodo, implementacion diferente segun DB
const restaurants = await restaurantDAO.getAll()
Interfaces DAO:
IUserDAO - getAll, getById, create, update, delete, getByKeycloakId
IRestaurantDAO - getAll, getById, create, update, delete
IMenuDAO - getAll, getById, getByRestaurant, create, update, delete
IProductDAO - getAll, getById, getByRestaurant, create, update, delete
IReservationDAO - getAll, getById, getByUser, getByRestaurant, create, update, delete
IOrderDAO - getAll, getById, getByUser, getByRestaurant, create, update, delete
9. Cache con Redis
Redis se utiliza como capa de cache para reducir la carga en las bases de datos y mejorar los tiempos de respuesta.
Estrategia de cache:
Cache-Aside: La aplicacion verifica Redis antes de consultar la BD
TTL (Time To Live): Las claves expiran automaticamente despues de un tiempo configurado
Invalidacion: Al crear/actualizar/eliminar recursos, se invalidan las claves de cache relacionadas
Formato de claves:
plain
Copy
cache:GET:/api/restaurants        # Cache de listado de restaurantes
cache:GET:/api/restaurants/:id    # Cache de restaurante especifico
cache:GET:/search/products?q=...  # Cache de busqueda
Middleware de cache:
JavaScript
Copy
// Verifica cache antes de ejecutar el controller
const cacheMiddleware = require('./src/middlewares/cache')

app.get('/restaurants', cacheMiddleware, restaurantController.getAll)
Invalidacion automatica:
JavaScript
Copy
// Al modificar un recurso, se eliminan las claves de cache relacionadas
await cacheInvalidate('GET:/restaurants*')
10. Busqueda con ElasticSearch
ElasticSearch proporciona busqueda full-text de alto rendimiento para productos.
Configuracion del indice:
JSON
Copy
{
  "mappings": {
    "properties": {
      "name": { "type": "text", "analyzer": "standard" },
      "category": { "type": "keyword" },
      "description": { "type": "text", "analyzer": "standard" },
      "restaurant_id": { "type": "keyword" },
      "price": { "type": "float" }
    }
  }
}
Flujo de indexacion:
El Search Service se conecta a PostgreSQL/MongoDB
Extrae todos los productos
Si un producto no tiene descripcion, asigna "Producto sin descripcion"
Indexa cada producto en ElasticSearch
Expone endpoints de busqueda con cache Redis
Ventajas:
Busqueda full-text con relevancia
Filtrado por categoria exacta
Escalabilidad independiente del microservicio principal
11. Balanceador de Carga (Nginx)
Nginx actua como gateway unico y balanceador de carga para todos los microservicios.
Configuracion de upstreams:
Table
Upstream	Servidores	Algoritmo
api_servers	api:3000	least_conn
search_servers	search-service:3001	least_conn
Reglas de routing:
Table
Path	Destino	Descripcion
/api/*	api_servers	API principal
/api/docs/*	api_servers	Documentacion API
/search/*	search_servers	Servicio de busqueda
/search/docs/*	search_servers	Documentacion Search
/health	api_servers	Health check API
/search-health	search_servers	Health check Search
/	api_servers	Default a API
Headers inyectados:
X-Real-IP: IP del cliente original
X-Forwarded-For: Cadena de proxies
X-Forwarded-Proto: Protocolo original
X-Gateway: Identificador del gateway
Verificacion de distribucion de carga:
bash
Copy
# Escalar servicios
docker compose up -d --scale api=3 --scale search-service=2

# Verificar que Nginx distribuye entre replicas
curl http://localhost/_host
curl http://localhost/search/_host
12. CI/CD Pipeline
El pipeline de GitHub Actions se ejecuta en cada push a main o develop, y en cada pull request.
Diagrama del pipeline
plain
Copy
+-------------+     +-------------+     +-------------+     +-------------+
|   Trigger   |---->|    Test     |---->|    Build    |---->|    Push     |
|  push/PR    |     |    Job      |     |    Job      |     |    to GHCR  |
+-------------+     +-------------+     +-------------+     +-------------+
                          |                   |
                          v                   v
                    +-------------+     +-------------+
                    |  Services   |     |   Docker    |
                    |  PostgreSQL |     |   Buildx    |
                    |  MongoDB    |     |             |
                    |  Redis      |     +-------------+
                    |  Elastic    |
                    +-------------+
Jobs del pipeline
Table
Job	Descripcion	Condicion
test	Ejecuta tests unitarios e integracion con cobertura >= 90%	Siempre
build-and-push	Construye imagenes Docker y publica en GHCR	Solo main
deploy-local	Verifica configuracion de Docker Compose	Solo main
Variables de entorno del pipeline
yaml
Copy
DB_TYPE: postgres
DB_HOST: localhost
DB_PORT: 5432
DB_USER: test
DB_PASSWORD: test
DB_NAME: testdb
REDIS_URL: redis://localhost:6379
MONGO_URI: mongodb://localhost:27017
ELASTICSEARCH_URL: http://localhost:9200
KEYCLOAK_URL: http://localhost:8080
Imagenes publicadas
Table
Imagen	Tag	Descripcion
ghcr.io/jserod/Restaurante-e2-Proyecto-I-BD-II/api	latest, sha, branch	API principal
ghcr.io/jserod/Restaurante-e2-Proyecto-I-BD-II/search	latest, sha, branch	Search service
13. Escalabilidad y Kubernetes
Escalabilidad con Docker Compose
Docker Compose permite escalar horizontalmente los microservicios:
bash
Copy
# Escalar API a 5 replicas
docker compose up -d --scale api=5

# Escalar Search a 3 replicas
docker compose up -d --scale search-service=3

# Escalar ambos simultaneamente
docker compose up -d --scale api=5 --scale search-service=3
Nginx distribuye automaticamente el trafico entre las replicas mediante resolucion DNS de Docker.
Escalabilidad con Kubernetes
Se proporcionan manifests de Kubernetes para despliegue en cluster local (Minikube):
Table
Recurso	Descripcion
Namespace	Aislamiento logico restaurant
ConfigMap	Variables de entorno no sensibles
Secret	Credenciales encriptadas
Deployment (API)	2 replicas iniciales, probes de salud
Deployment (Search)	2 replicas iniciales, probes de salud
Service (API)	ClusterIP para descubrimiento DNS
Service (Search)	ClusterIP para descubrimiento DNS
HPA (API)	Escalado automatico 2-5 replicas (CPU 70%)
HPA (Search)	Escalado automatico 2-4 replicas (CPU 70%)
Ingress	Entrypoint unico con routing por path
Comandos de despliegue:
bash
Copy
# Iniciar Minikube
minikube start

# Habilitar Ingress Controller
minikube addons enable ingress

# Desplegar todos los recursos
kubectl apply -f k8s/

# Verificar estado
kubectl get pods -n restaurant
kubectl get svc -n restaurant
kubectl get hpa -n restaurant
14. Seguridad
Autenticacion y Autorizacion
Table
Componente	Descripcion
Keycloak	Servidor de identidad OpenID Connect
JWT	Tokens de acceso con expiracion
Roles	admin y user
Middleware keycloakProtect	Valida token en cada request
Middleware attachUser	Inyecta usuario en req.user
Middleware requireRole	Verifica roles permitidos
Flujo de seguridad
plain
Copy
Cliente --> Nginx --> API --> keycloakProtect (valida JWT)
                                      |
                                      v
                              attachUser (extrae claims)
                                      |
                                      v
                              requireRole(['admin']) (autoriza)
                                      |
                                      v
                              Controller (ejecuta)
15. Conclusiones
Logros alcanzados
Arquitectura profesional: Se implemento una arquitectura de microservicios con separacion de responsabilidades clara entre API principal y servicio de busqueda.
Dualidad de bases de datos: El patron DAO con Factory permite cambiar entre PostgreSQL y MongoDB sin modificar la logica de negocio, cumpliendo con el requisito de configuracion dinamica.
MongoDB Sharding: Se configuro un cluster completo con config servers, replica set de shard y router mongos, con inicializacion automatica via scripts.
Busqueda escalable: ElasticSearch proporciona busqueda full-text independiente del microservicio principal, con reindexacion manual y cacheo de resultados.
Cache distribuido: Redis reduce la carga en bases de datos y mejora tiempos de respuesta para consultas frecuentes.
CI/CD automatizado: GitHub Actions ejecuta tests con cobertura del 90%, construye imagenes Docker y las publica en GitHub Container Registry.
Escalabilidad horizontal: Tanto Docker Compose como Kubernetes permiten escalar los microservicios de API y busqueda segun demanda.
Datos de prueba con LLM: Se implemento un generador de datos realistas utilizando modelos de lenguaje local (Ollama/Llama 3.2), garantizando privacidad y cero costos.
Lecciones aprendidas
La sensibilidad a mayusculas/minusculas de Linux en CI/CD requiere atencion especial en el nombrado de archivos.
El sharding de MongoDB agrega complejidad operativa pero mejora significativamente el rendimiento para grandes volumenes de datos.
La separacion de microservicios (API vs Search) permite escalar independientemente segun el patron de carga.
Trabajo futuro
Implementar sharding adicional para multiples shards (Shard 2, Shard 3) segun crecimiento de datos.
Agregar monitorizacion con Prometheus y Grafana.
Implementar circuit breaker y retry policies entre microservicios.
Migrar a Kubernetes en cloud (GKE, EKS, AKS) para produccion.
Referencias
Docker Documentation. https://docs.docker.com/
MongoDB Sharding. https://docs.mongodb.com/manual/sharding/
ElasticSearch. https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
Redis. https://redis.io/documentation
Keycloak. https://www.keycloak.org/documentation
Kubernetes. https://kubernetes.io/docs/
Ollama. https://ollama.com/
GitHub Actions. https://docs.github.com/en/actions