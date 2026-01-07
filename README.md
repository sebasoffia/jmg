# jemingüey

Validador de contenido en español tipo Hemingway App. Analiza legibilidad, detecta voz pasiva, adverbios débiles, muletillas y más.

## Demo

Abre `index.html` en tu navegador para probar el editor sin backend.

```bash
# macOS
open index.html

# O usa un servidor local
npx serve .
```

## Stack

- **Frontend**: HTML5 + Tailwind CSS + Alpine.js
- **Backend**: Supabase (Auth + PostgreSQL)
- **Pagos**: MercadoPago (suscripciones)

## Configuración de Supabase

### 1. Crear proyecto

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se inicialice (~2 minutos)

### 2. Obtener credenciales

En tu proyecto de Supabase:
1. Ve a **Settings** → **API**
2. Copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`

### 3. Ejecutar migraciones

1. Ve a **SQL Editor** en Supabase
2. Copia el contenido de `supabase/migrations/001_initial_schema.sql`
3. Ejecuta el script

### 4. Configurar autenticación

1. Ve a **Authentication** → **Providers**
2. Habilita **Email** (ya está habilitado por defecto)
3. (Opcional) Habilita **Google** para login con Google

### 5. Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
```

## Configuración de MercadoPago

### 1. Crear cuenta de vendedor

1. Ve a [mercadopago.cl](https://www.mercadopago.cl)
2. Crea una cuenta de vendedor si no tienes
3. Completa la verificación

### 2. Obtener credenciales

1. Ve a [Credenciales](https://www.mercadopago.cl/developers/panel/app)
2. Crea una aplicación nueva
3. Copia:
   - `Access Token` → `MERCADOPAGO_ACCESS_TOKEN`
   - `Public Key` → `MERCADOPAGO_PUBLIC_KEY`

### 3. Crear plan de suscripción

Ejecuta este script para crear el plan de suscripción:

```javascript
// createPlan.js
const accessToken = 'TU_ACCESS_TOKEN';

fetch('https://api.mercadopago.com/preapproval_plan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'jemingüey Pro',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 1000,
      currency_id: 'CLP'
    },
    back_url: 'https://tu-dominio.com/subscription/callback'
  })
})
.then(r => r.json())
.then(console.log);
```

### 4. Configurar webhook

1. En MercadoPago, ve a **Webhooks**
2. Configura la URL: `https://tu-proyecto.supabase.co/functions/v1/mercadopago-webhook`
3. Selecciona eventos: `subscription`

### 5. Desplegar Edge Function

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link proyecto
supabase link --project-ref TU_PROJECT_REF

# Desplegar función
supabase functions deploy mercadopago-webhook
```

## Estructura del proyecto

```
jeminguey/
├── index.html              # SPA principal
├── js/
│   ├── analyzer/
│   │   ├── index.js        # Coordinador
│   │   ├── readability.js  # Métricas de legibilidad
│   │   └── style.js        # Análisis de estilo
│   └── data/
│       ├── adverbs.js      # Lista de adverbios
│       ├── weak-words.js   # Palabras débiles
│       ├── fillers.js      # Muletillas
│       └── passive.js      # Patrones voz pasiva
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── mercadopago-webhook/
├── .env.example
└── README.md
```

## Modelo de precios

| Plan | Límite | Precio |
|------|--------|--------|
| Gratis | 1,000 palabras/análisis | $0 |
| Pro | Ilimitado | $1,000 CLP/mes |

## Funcionalidades

### Gratis
- Análisis de legibilidad (Flesch-Szigriszt)
- Detección de oraciones largas
- Detección de voz pasiva
- Detección de adverbios en -mente
- Detección de palabras débiles
- Detección de muletillas

### Pro
- Sin límite de palabras
- Historial ilimitado
- Generador JSON-LD para SEO
- Exportar PDF/Markdown
- Templates personalizados

## Desarrollo

El frontend funciona standalone sin backend. Para desarrollo local:

```bash
# Servidor simple
npx serve .

# O con Python
python -m http.server 8000
```

## Licencia

MIT
