# Manual técnico de TacticalPro

Guía corta para quien vaya a tocar el código. Lo que hace la app está en el README.

## Piezas

React 18 + TypeScript + Vite. Se instala como app (PWA) y funciona sin conexión. No hay servidor ni cuentas: todo se guarda en el dispositivo.

| Carpeta | Qué hay | Dónde mirar primero |
| --- | --- | --- |
| `src/App.tsx` | Une las piezas: estado de la pizarra, animación, exportar y qué hoja está abierta | Empieza aquí para seguir cualquier botón |
| `src/nucleo/` | Datos y reglas, sin pantalla | `model.ts` (fichas, trazos, pasos), `motion.ts` (animación continua), `steps.ts` («+ Paso»), `storage.ts` y `backup.ts` (guardar y copias), `preferencias.ts`, `historial.ts` (deshacer), `guardado.ts` (autoguardado) |
| `src/pantalla/` | Lo que se ve | `Scene.tsx` dibuja el campo completo; `Pitch.tsx` el césped, `Shapes.tsx` fichas y trazos |
| `src/pantalla/barras/` | Barra de arriba, pasos, herramientas y barra de la ficha elegida | `Herramientas.tsx` tiene los grupos del menú (`TOOL_GROUPS`) |
| `src/pantalla/hojas/` | Hojas que se abren: plantillas, jugadas, exportar, fichas, ayuda, Mi identidad | Una hoja por archivo |
| `src/pantalla/campo/` | Tocar, arrastrar, dibujar y borrar con dedo, ratón o S Pen | `entrada.ts` |
| `src/contenido/` | Plantillas, sesiones, consejos, fundamentos y guía | `templates.ts` reúne todas las plantillas |
| `src/exportar/` | Vídeo MP4 e imagen | `exportVideo.ts` |
| `src/extras.ts` | Enchufes para otra versión (ver abajo) | En la web están vacíos |
| `src/i18n.ts`, `src/lang/` | Español e inglés | Todo texto nuevo pasa por `t()` y se añade a `en.json` |

Coordenadas en metros, con el equipo local atacando hacia la derecha.

## Reglas de la casa

- **La guía de uso no se edita a mano.** Su fuente es `marca/fuente-guia/data.py` (en la carpeta del proyecto); `gen_app.py` crea `src/contenido/guia.ts`.
- **Una plantilla animada**: las flechas de cada paso muestran el movimiento hacia el paso siguiente; la nota explica ese paso.
- **No mezclar versiones.** La web (rama `main`) no lleva código de otras versiones, ni apagado. Otra versión se conecta solo por `src/extras.ts`. `tests/separacion.test.ts` lo vigila.

## Enchufes (`src/extras.ts`)

Puntos por donde otra versión añade funciones sin tocar el resto del código. En la web `useExtras` devuelve `{}`, `PLANTILLAS_EXTRA` está vacío y `leerFichasExtra` no existe, así que todo se ve y funciona igual que sin ellos.

| Enchufe | Dónde aparece |
| --- | --- |
| `marca`, `vista`, `nombreFichas` | Barra de arriba: junto al nombre, al final de «Vista» y el nombre del botón de fichas |
| `barraPasos`, `trasPasos`, `sinPasos`, `ritmo` | Barra de pasos: otra barra en su lugar, botones añadidos y el ritmo de cada paso |
| `desvio`, `noMover` | Campo: mandar el puntero a otra función o impedir mover una ficha |
| `fichas`, `exportar`, `bienvenida` | Hoja de fichas, hoja de exportar y pantalla al abrir |
| `leerFichasExtra`, `PLANTILLAS_EXTRA` | Fichas al abrir y plantillas añadidas al final |

## Antes de publicar

```bash
npx tsc -b && npx eslint . && npm test
npm run control:botones                                   # 17 comprobaciones de botones
npm run control:capturas -- --comparar <carpeta>          # 60 capturas, avisa si cambia un píxel
```

Las capturas de referencia de la web están en `control/web` (carpeta del proyecto). Si un cambio es visual a propósito, se vuelven a guardar con `--guardar` después de que el dueño lo apruebe.

Publicar: cada cambio en `main` se publica solo en tacticalpro.app (GitHub Pages, `.github/workflows/deploy.yml`), que antes pasa las pruebas. Nada se une a `main` sin el OK del dueño.
