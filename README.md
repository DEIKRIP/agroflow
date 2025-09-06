# 🌱 SiembraPais - Sistema de Gestión Agrícola

Plataforma integral para la gestión de agricultores, parcelas, inspecciones y financiamiento agrícola. Construida con tecnologías modernas para ofrecer una experiencia de usuario fluida y eficiente.

## 🚀 Características Principales

### 👨‍🌾 Gestión de Agricultores
- Registro y seguimiento de agricultores
- Perfiles detallados con historial completo
- Sistema de clasificación por riesgo
- Documentación digitalizada

### 🌾 Gestión de Parcelas
- Mapeo y geolocalización con Leaflet
- Seguimiento de cultivos
- Historial de producción
- Análisis de suelo y condiciones ambientales

### 🔍 Flujo de Inspecciones
- Programación de inspecciones
- Formularios digitales personalizables
- Carga de evidencia fotográfica
- Reportes automáticos

### 💰 Módulo de Financiamiento
- Solicitudes de crédito agrícola
- Evaluación de riesgo crediticio
- Seguimiento de pagos
- Integración con Bolívar Digital

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Framework**: React 18 + Vite
- **Estilos**: TailwindCSS con plugins (forms, typography, aspect-ratio)
- **Estado**: Redux Toolkit + React Context
- **Enrutamiento**: React Router v6
- **Gráficos**: Recharts + D3.js
- **Formularios**: React Hook Form
- **Mapas**: Leaflet + React Leaflet
- **UI/UX**: Headless UI, Radix UI, Framer Motion

### Backend (Supabase)
- **Autenticación**: Supabase Auth
- **Base de Datos**: PostgreSQL
- **Almacenamiento**: Supabase Storage
- **Funciones Serverless**: Edge Functions

### Herramientas de Desarrollo
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **Bundler**: Vite

## 🚀 Comenzando

### Prerrequisitos
- Node.js 18.x o superior
- npm 9.x o yarn 1.22+
- Cuenta en [Supabase](https://supabase.com/)

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/DEIKRIP/agroflow.git
   cd agroflow
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```
   Nota: No subas `.env` a Git. Ya está añadido a `.gitignore`.

4. Inicia el servidor de desarrollo:
   ```bash
   npm run start
   # o
   yarn start
   ```

## 🏗️ Estructura del Proyecto

```
src/
├── @types/             # Definiciones de tipos TypeScript
├── components/         # Componentes reutilizables
│   ├── auth/          # Componentes de autenticación
│   ├── layout/        # Componentes de diseño
│   └── ui/            # Componentes UI atómicos
├── config/            # Configuraciones de la aplicación
├── contexts/          # Contextos de React
├── features/          # Características del negocio
│   ├── dashboard/     # Panel de control
│   ├── farmers/       # Módulo de agricultores
│   ├── financing/     # Módulo de financiamiento
│   ├── inspections/   # Módulo de inspecciones
│   └── parcels/       # Módulo de parcelas
├── hooks/             # Custom hooks
├── lib/               # Utilidades y configuraciones
│   └── supabase/      # Configuración de Supabase
├── pages/             # Componentes de página
│   ├── auth/          # Páginas de autenticación
│   └── ...
├── services/          # Servicios y lógica de negocio
├── styles/            # Estilos globales
└── utils/             # Utilidades y helpers
```

## 🚀 Despliegue

### Construir para producción
```bash
npm run build
# o
yarn build
```

### Previsualizar producción localmente
```bash
npm run serve
# o
yarn serve
```

### Despliegue en Vercel/Netlify
El proyecto está configurado para ser desplegado directamente en plataformas como Vercel o Netlify. Simplemente conecta tu repositorio y configura las variables de entorno.

## 📄 Licencia
Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Créditos
Desarrollado con ❤️ para el sector agrícola venezolano.

 

## 🏗️ Construcción para Producción

Para crear una versión optimizada para producción:

```bash
npm run build
# o
yarn build
```

Los archivos de producción se generarán en el directorio `dist/`.

## 🔧 Variables de Entorno

| Variable                | Requerido | Descripción                             |
|-------------------------|-----------|-----------------------------------------|
| VITE_SUPABASE_URL      | Sí        | URL de tu proyecto Supabase             |
| VITE_SUPABASE_ANON_KEY | Sí        | Clave anónima de Supabase               |
| VITE_API_BASE_URL      | No        | URL base para APIs personalizadas       |

## 📊 Base de Datos

El esquema de la base de datos incluye las siguientes tablas principales:

- `farmers`: Información de agricultores
- `parcels`: Detalles de parcelas
- `inspections`: Registros de inspecciones
- `financing`: Solicitudes de financiamiento
- `user_profiles`: Perfiles de usuario

## 🤝 Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Distribuido bajo la licencia MIT. Consulta el archivo `LICENSE` para más información.

## 📧 Contacto

DEIkrip- deikermadridmanz@gmail.com

Enlace del Proyecto: [https://github.com/DEIKRIP/agroflow](https://github.com/DEIKRIP/agroflow)

## 🙏 Agradecimientos

- [Supabase](https://supabase.com/) por su increíble plataforma
- [TailwindCSS](https://tailwindcss.com/) por los estilos
- La comunidad de código abierto
- ING FRANCISCO QUIJADA POR LA IDEA 💡
