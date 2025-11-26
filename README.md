# easy-labs-clinicas-api

API REST para el proyecto SaaS de clínicas "easy-labs-clinicas-api".

Descripción

Este repositorio contiene la API backend en Node.js/Express para gestionar pacientes, citas, usuarios y multi-tenancy.

Características
- API REST en Node.js/Express
- Soporte básico de multi-tenancy (middleware/middleware resolveTenant.js)
- Estructura modular pensada para servicios, controladores y middlewares

Instalación

1. Clona el repositorio:
   git clone https://github.com/nicolasanra/easy-labs-clinicas-api.git
2. Entra en el proyecto:
   cd easy-labs-clinicas-api
3. Instala dependencias:
   npm install
4. Crea un archivo .env basado en .env.example (si existe) y configura las variables necesarias.

Variables de entorno (ejemplo)
- NODE_ENV=development
- PORT=3000
- DATABASE_URL=postgres://user:pass@host:port/dbname
- JWT_SECRET=tu_secreto

Uso

- Ejecutar en desarrollo:
  npm run dev
- Ejecutar en producción:
  npm start

Middleware de tenant

El proyecto incluye middleware/middleware resolveTenant.js para resolver el tenant desde:
- header X-Tenant-Id
- query param tenant
- subdominio (ej.: <tenant>.example.com)

Si no se resuelve el tenant, por defecto la petición retorna un error 400, o puedes configurar un valor por defecto en las opciones del middleware.

Copiar y usar (sin contribuciones)

Si quieres usar este proyecto en tu propio repositorio, eres libre de copiar los archivos y usarlos en tu código. Para evitar confusiones y garantizar la estabilidad del proyecto principal, este repositorio NO acepta contribuciones externas. Por favor, NO abras Pull Requests ni issues solicitando cambios. Si deseas modificar o mejorar el código, copia el contenido a tu propio repositorio y trabaja allí.

Estructura recomendada
- middleware/        -> middlewares (incluye resolveTenant.js)
- routes/            -> definiciones de rutas
- controllers/       -> lógica de controladores
- services/          -> lógica de negocio
- models/            -> modelos y acceso a datos
- config/            -> configuración y utilidades

Tests

- Añade tests según el framework que prefieras (jest, mocha, etc.)
- Comando sugerido para ejecutar tests:
  npm test

Contribuir

Este proyecto NO acepta contribuciones externas. No abras Pull Requests en este repositorio. Si necesitas cambios, copia el repositorio y trabaja en tu propia copia.

Licencia

Este proyecto se publica bajo la licencia MIT. Puedes copiar, usar y redistribuir el código en tus propios repositorios según los términos de la licencia MIT incluida en el archivo LICENSE.