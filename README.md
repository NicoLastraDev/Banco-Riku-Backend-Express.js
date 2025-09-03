# Banco-Riku-Backend-Express.js
Es el backend para conectarse a la base de datos de postgres de la aplicacion banco ripley creada en react native


Este es el backend del proyecto **Banco Riku**, desarrollado con **Node.js** y **Express.js**.  
Se encarga de manejar la lógica de negocio, conexión a la base de datos y la gestión de las rutas de la aplicación.

---

## 🚀 Tecnologías usadas
- [Node.js](https://nodejs.org/) - Entorno de ejecución
- [Express.js](https://expressjs.com/) - Framework para construir el servidor
- [dotenv](https://github.com/motdotla/dotenv) - Manejo de variables de entorno
- [Nodemon](https://nodemon.io/) - Desarrollo en caliente
- [MongoDB / PostgreSQL / MySQL] *(elige según tu base de datos)*

---

## 📂 Estructura del proyecto
```bash
Banco-Riku-Backend-Express.js/
├── src/
│   ├── routes/        # Definición de rutas de la API
│   ├── controllers/   # Controladores (lógica de negocio)
│   ├── models/        # Modelos de datos
│   └── index.js       # Punto de entrada principal
├── .env.example       # Variables de entorno (ejemplo)
├── package.json
└── README.md

Pasos
1. git clone https://github.com/NicoLastraDev/Banco-Riku-Backend-Express.js.git

2. cd Banco-Riku-Backend-Express.js
npm install

3. crea un archivo .env con lo siguiente:

    PORT=4000
    PGUSER=postgres
    PGHOST=localhost
    PGDATABASE=Banco-app
    PGPASSWORD='tu contraseña de postgres'
    PGPORT=5432
    JWT_SECRET=supersecreto
    ADMIN_PASSWORD='TuSuperPassword123'
