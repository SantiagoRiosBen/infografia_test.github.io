# Infografía interactiva: Restaurantes en Medellín

Proyecto estático (sin framework ni build) usando **D3.js v7** para GitHub Pages.

## Estructura

- `index.html`
- `style.css`
- `main.js`
- `charts.js`
- `data/restaurantes.csv`

## Ejecutar localmente

Abre `index.html` en el navegador o usa un servidor simple:

```bash
python -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Publicar en GitHub Pages

> Si en GitHub solo ves `.gitkeep`, significa que aún no has subido esta rama o no está en `main`.

1. Sube los cambios al repositorio remoto:

```bash
git push -u origin work
```

2. Si quieres que quede directamente en `main`, haz merge y push:

```bash
git checkout -b main
# o git checkout main (si ya existe localmente)
git merge work
git push -u origin main
```

3. En GitHub: **Settings → Pages**
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`

La URL final suele quedar así:

`https://<tu-usuario>.github.io/infografia_test.github.io/`

## Qué incluye

- Navegación sticky por secciones.
- Filtros por zona, tipo, rango de precio y buscador por nombre/barrio.
- Gráficas D3 interactivas (tooltips, transiciones y hover):
  - barras por tipo de cocina,
  - dona por zona,
  - scatter precio vs calificación.
- Tarjetas de restaurantes con actualización dinámica y estado sin resultados.
