# 🚀 Guía Rápida de Deployment - Tutor Virtual IA

## Opción Más Rápida: Vercel Dashboard (3 minutos)

### Paso 1: Preparar archivos
✅ Ya están listos todos los archivos necesarios

### Paso 2: Crear cuenta en Vercel
1. Ve a https://vercel.com/signup
2. Regístrate con GitHub, GitLab o Email
3. Confirma tu email

### Paso 3: Desplegar
**Opción A - Arrastrar y soltar (MÁS FÁCIL):**
1. Ve a https://vercel.com/new
2. Arrastra la carpeta `tutor-virtual` completa a la página
3. Haz clic en "Deploy"
4. ¡Listo en 30 segundos!

**Opción B - Desde GitHub:**
1. Sube tu proyecto a GitHub:
   ```bash
   git init
   git add .
   git commit -m "Tutor Virtual IA"
   ```
2. Crea un repo en GitHub y súbelo
3. En Vercel, importa el repositorio
4. Deploy automático

### Paso 4: Obtener tu URL
Vercel te dará una URL como:
```
https://tutor-virtual-abc123.vercel.app
```

### Paso 5: Configurar API Key
1. Ve a https://console.cloud.google.com/apis/credentials
2. Selecciona tu API key
3. En "Application restrictions":
   - Selecciona "HTTP referrers (web sites)"
   - Agrega: `https://tutor-virtual-abc123.vercel.app/*`
   - Agrega también: `https://*.vercel.app/*` (para todos tus deploys)
4. Guarda

### Paso 6: ¡Usar tu app!
1. Abre tu URL de Vercel
2. Ingresa tu API key
3. ¡Funciona! 🎉

---

## ¿Problemas?

**Si no puedes configurar restricciones en la API key:**
- Crea una nueva API key en Google AI Studio
- Las nuevas keys no tienen restricciones por defecto

**Si Vercel no funciona:**
- Prueba con Netlify: https://app.netlify.com/drop
- Mismo proceso de arrastrar y soltar

---

## Archivos del proyecto listos para deployment:
- ✅ index.html
- ✅ styles.css  
- ✅ app.js
- ✅ README.md
- ✅ vercel.json (configuración)
- ✅ package.json (metadata)
