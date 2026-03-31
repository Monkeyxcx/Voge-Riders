# Diseño de páginas (desktop-first) — Web Grupo Voge

## Global
### Layout
- Base: contenedor centrado `max-width: 1200px`, padding lateral 24px.
- Sistema: Flexbox para barras/filas; CSS Grid para listados (tarjetas).
- Breakpoints: desktop (>=1024) como primario; tablet (>=768) reduce columnas; mobile (<768) una columna, menú colapsable.

### Meta (por defecto)
- Title base: `Grupo Voge — {Sección}`
- Description base: catálogo comunitario de modelos, fallas/soluciones, talleres y comentarios.
- Open Graph: `og:title`, `og:description`, `og:type=website`.

### Estilos / tokens
- Fondo: `#0B0F14` (oscuro) o `#FFFFFF` (claro) según tema; por defecto oscuro.
- Superficies (cards): `#121826`; borde `#223042`.
- Tipografía: sans (p.ej. Inter). Escala: 14/16/20/24/32.
- Color acento: `#FF3D2E` (rojo Voge-like) para CTAs y estados activos.
- Links: subrayado en hover; foco visible (outline 2px acento).
- Botones:
  - Primario: fondo acento, texto blanco; hover +8% brillo.
  - Secundario: borde, fondo transparente; hover superficie más clara.
- Estados: loading con skeleton; empty state con texto + CTA.

---

## 1) Página: Inicio (/)
### Meta
- Title: `Grupo Voge — Inicio`
- Description: accesos rápidos a modelos, fallas/soluciones y talleres.

### Estructura
- Patrón: secciones apiladas.
1. **Header fijo (sticky)**
   - Izquierda: logo/nombre.
   - Centro: navegación (Modelos, Talleres).
   - Derecha: estado de sesión ("Entrar" o avatar + "Salir").
2. **Hero + buscador**
   - Título y subtítulo corto.
   - Input de búsqueda (placeholder: “Busca modelo, falla o palabra clave…”).
3. **Accesos rápidos**
   - 2 cards grandes: “Catálogo de modelos” y “Talleres recomendados”.
4. **Bloques de actividad** (dos columnas en desktop, una en mobile)
   - “Fallas recientes” (lista compacta enlazable a ficha de modelo).
   - “Comentarios recientes” (preview 1–2 líneas + enlace al detalle).

### Interacciones
- Buscar: Enter ejecuta búsqueda y redirige a /modelos con query.
- CTA “Entrar”: redirige a /login.

---

## 2) Página: Catálogo de modelos (/modelos)
### Meta
- Title: `Grupo Voge — Modelos`
- Description: lista de modelos Voge con filtros y acceso a fallas/soluciones.

### Estructura
- Patrón: grid de tarjetas + panel de filtros.
1. **Barra superior**: título + contador de resultados.
2. **Filtros** (panel lateral en desktop; acordeón arriba en mobile)
   - Tipo, cilindrada (rango simple), año (select si existe).
   - Botón “Limpiar”.
3. **Listado**
   - Grid 3 columnas (desktop), 2 (tablet), 1 (mobile).
   - Card de modelo: nombre, tipo/cc, badges y botón “Ver ficha”.

### Estados
- Empty: “No hay resultados” + limpiar filtros.

---

## 3) Página: Ficha de modelo (/modelos/:slug)
### Meta
- Title: `Grupo Voge — {Modelo}`
- Description: fallas frecuentes y soluciones del modelo.

### Estructura
- Patrón: contenido principal + sidebar (desktop).
1. **Header de ficha**
   - Nombre del modelo + chips (tipo, cc, año).
2. **Contenido principal**
   - Sección “Fallas frecuentes” como acordeón/tabla:
     - Cada falla: título, síntomas, severidad.
     - Sub-sección “Soluciones”: pasos y piezas (si aplica).
3. **Sidebar**
   - “Enlaces rápidos” (anclas a fallas) y CTA a talleres (/talleres).
4. **Comentarios**
   - Lista cronológica (más recientes arriba).
   - Caja de comentario:
     - Si no autenticado: aviso + botón “Inicia sesión para comentar”.
     - Si autenticado: textarea + botón “Publicar”.
   - En comentarios propios: acciones “Editar” y “Eliminar”.

### Interacciones
- Publicar/editar/eliminar: feedback con toast y estado loading.

---

## 4) Página: Talleres recomendados (/talleres)
### Meta
- Title: `Grupo Voge — Talleres`
- Description: talleres recomendados por el grupo.

### Estructura
- Patrón: listado con filtros + cards.
1. **Filtros**
   - Ciudad/zona (select o input), etiquetas (chips).
2. **Listado**
   - Cards: nombre, ciudad, 1–2 líneas de dirección/contacto, badges de tags, CTA “Ver taller”.

---

## 5) Página: Ficha de taller (/talleres/:id)
### Meta
- Title: `Grupo Voge — {Taller}`
- Description: datos del taller y comentarios del grupo.

### Estructura
- Patrón: ficha + comentarios.
1. Datos: nombre, ciudad, dirección, contacto, tags.
2. Notas del grupo (texto corto, si existe).
3. Comentarios: mismo patrón que ficha de modelo (login gating + CRUD propio).

---

## 6) Página: Acceso (/login y /registro)
### Meta
- Title: `Grupo Voge — Acceso`
- Description: inicia sesión o crea una cuenta para comentar.

### Estructura
- Patrón: card centrada.
1. **Tabs o rutas separadas**: Login / Registro.
2. **Form**
   - Email, password.
   - CTA primario.
   - Link “¿Olvidaste tu contraseña?” (flujo de recuperación de Supabase).
3. **Copy de confianza**
   - Nota corta: “Solo miembros autenticados pueden publicar comentarios.”