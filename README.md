# Reserva Inteligente de Restaurantes

API REST para la gestión de reservas en restaurantes, con autenticación JWT mediante Keycloak, contenedorización con Docker y documentación con Swagger.

---

## Descripción del Proyecto

Este sistema permite gestionar usuarios, restaurantes, menús, reservas de mesas y pedidos. La API está protegida con autenticación basada en JWT mediante Keycloak, y diferencia entre dos roles: `client` y `admin`.

---

## Requisitos Previos

- [Docker](https://www.docker.com/products/docker-desktop) y Docker Compose instalados

---

## Instalación y Uso

### 1. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
PORT=3000
POSTGRES_EXTERNAL_PORT=5432

DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=restaurant

KEYCLOAK_PORT=8080
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin

KEYCLOAK_URL=http://localhost:8080/
KEYCLOAK_REALM=restaurant-realm
KEYCLOAK_CLIENT_ID=restaurant-api
KEYCLOAK_CLIENT_SECRET=client-secret
```

### 2. Levantar los servicios con Docker

```bash
docker compose up
docker compose up --scale api=3 --scale search-service=2
```

Esto levanta los contenedores de PostgreSQL, Keycloak y Rest API.

### 3. Configurar Keycloak CORREGIR

Una vez que Keycloak esté corriendo en `http://localhost:8080`:

1. Iniciar sesión con las credenciales de administrador
2. Ir a Manage Realms y seleccionar `restaurant-realm`
3. Crear los usuarios de prueba y asignarles contraseña y el rol correspondiente (`admin` o `user`) desde **Role mapping → Assign Role → Client roles**
4. Entrar al cliente `restaurant-api`. Copiar el **Client secret** desde la pestaña **Credentials** y colocarlo en el `.env`

### 4. Acceder a Swagger

Una vez esten lo contenedores activos entra en `http://localhost:3000/api/docs`:

En Swagger se mostraran todos los endpoint y podras interactuar con ellos
1. Entrar a /auth/register y agregar los datos del json para crear un usuario en keycloak 
2. Usar esos mismos datos para entrar a /auth/login y copia el token de acceso
3. Hacer click en **Authorize** e ingresar el token obtenido en el paso anterior para probar los endpoints directamente desde la interfaz.

### 5. Realizar pruebas unitarias

```bash
npm test -- --coverage --coverageReporters=text-summary
```
Con ese comando aprecian las pruebas unitarias que cubren el poco más del 90%

## Endpoints Disponibles

### Autenticación — Keycloak

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de un nuevo usuario |
| POST | `/auth/login` | Inicio de sesión y obtención de JWT |

> Estos endpoints son gestionados directamente por Keycloak.

### Usuarios

| Método | Endpoint | Rol requerido | Descripción |
|--------|----------|---------------|-------------|
| GET | `/users` | admin | Listar todos los usuarios |
| GET | `/users/me` | user / admin | Obtener usuario autenticado |
| PUT | `/users/:id` | user / admin | Actualizar información de un usuario de keycloak |
| DELETE | `/users/:id` | admin | Eliminar un usuario de keycloak |

### Restaurantes

| Método | Endpoint | Rol requerido | Descripción |
|--------|----------|---------------|-------------|
| GET | `/restaurants` | user / admin | Listar restaurantes disponibles |
| GET | `/restaurants/:id` | user / admin | Obtener un restaurante por ID |
| POST | `/restaurants` | admin | Registrar un restaurante |
| PUT | `/restaurants/:id` | admin | Actualizar un restaurante |
| DELETE | `/restaurants/:id` | admin | Eliminar un restaurante |

### Menús

| Método | Endpoint | Rol requerido | Descripción |
|--------|----------|---------------|-------------|
| GET | `/menus` | user / admin | Listar todos los menús |
| GET | `/menus/:id` | user / admin | Obtener un menú por ID |
| POST | `/menus` | admin | Crear un nuevo menú |
| PUT | `/menus/:id` | admin | Actualizar un menú |
| DELETE | `/menus/:id` | admin | Eliminar un menú |

### Reservas

| Método | Endpoint | Rol requerido | Descripción |
|--------|----------|---------------|-------------|
| GET | `/reservations` | user / admin | Listar todas las reservas |
| GET | `/reservations/:id` | user / admin | Obtener una reserva por ID |
| POST | `/reservations` | user / admin | Crear una nueva reserva |
| PUT | `/reservations/:id` | user / admin | Actualizar una reserva |
| DELETE | `/reservations/:id` | user / admin | Cancelar una reserva |

### Pedidos

| Método | Endpoint | Rol requerido | Descripción |
|--------|----------|---------------|-------------|
| GET | `/orders` | user / admin | Listar todos los pedidos |
| GET | `/orders/:id` | user / admin | Obtener un pedido por ID |
| POST | `/orders` | user / admin | Realizar un pedido |
| PUT | `/orders/:id` | user / admin | Actualizar estado de un pedido |
| DELETE | `/orders/:id` | user / admin | Eliminar un pedido |

---

## Estructura del Proyecto

```
TC01_BDII/
├── keycloak/
│   └── realm-export.json
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── keycloak.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── usersController.js
│   │   ├── restaurantsController.js
│   │   ├── menuController.js
│   │   ├── reservationsController.js
│   │   └── ordersController.js
│   ├── database/
│   │   └── init.js
│   ├── middlewares/
│   │   ├── attachUser.js
│   │   ├── authUser.js
│   │   └── requireRole.js
│   ├── models/
│   │   ├── users.js
│   │   ├── restaurants.js
│   │   ├── menus.js
│   │   ├── reservations.js
│   │   └── orders.js
│   ├── routes/
│   │   ├── usersRoutes.js
│   │   ├── restaurantsRoutes.js
│   │   ├── menusRoutes.js
│   │   ├── reservationsRoutes.js
│   │   └── ordersRoutes.js
│   └── app.js
├── .env
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## Tecnologías Utilizadas

- **Node.js** + **Express** — servidor y API REST
- **PostgreSQL** — Base de datos relacional
- **Keycloak** — Autenticación y gestión de sesiones con JWT
- **Docker** + **Docker Compose** — Contenedorización y orquestación
- **Swagger** — Documentación interactiva de la API