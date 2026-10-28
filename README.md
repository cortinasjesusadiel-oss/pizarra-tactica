# TacticalPro

Pizarra táctica de fútbol 11 pensada para el móvil y el S Pen, con plantillas de sistemas, acciones a balón parado (ABP) y ejercicios.

## Funciones

- Campo completo, medio campo y espacio reducido 40×30. En el móvil en vertical el campo gira solo para verse más grande.
- Fichas de jugadores local, rival y comodín, balón y conos. Tocar una ficha permite cambiar dorsal, nombre, equipo o eliminarla.
- Botón Fichas: forma (ficha pro, clásica o camiseta), mostrar número, nombre o ambos, y color de cada equipo.
- Trazos: pase, carrera, conducción (línea ondulada), zona y dibujo libre, en 4 colores.
- S Pen: en modo Mover, el lápiz mueve la ficha que toca y dibuja si toca el césped; con una herramienta de dibujo elegida, siempre dibuja. El dedo mueve fichas. La presión cambia el grosor. El botón lateral borra. Se ignora la palma mientras el lápiz está apoyado.
- Animación continua y suave: las fichas siguen curvas que pasan por todos los pasos, sin paradas ni saltos. Reproducir, pausa, paso anterior y siguiente, explicación de cada paso. Puedes crear tus propias animaciones con “+ Paso”.
- Exportar varias jugadas a la vez (las animadas en vídeo y las demás en imagen) y marca de agua sutil configurable en el margen del campo.
- Exportar vídeo MP4 (1280×720, 30 imágenes por segundo) de cualquier jugada animada, con la explicación de cada paso. Se crea fotograma a fotograma, así sale fluido aunque el móvil vaya lento.
- Modo proyector: botón Proyectar para mostrar la jugada a pantalla completa en la charla. Se pasa de paso con las flechas, con un mando de presentaciones o tocando a los lados; espacio para reproducir y Esc para salir.
- Página web de presentación en `web/` (https://cortinasjesusadiel-oss.github.io/pizarra-tactica/web/).
- Plantillas (63, 53 animadas) en grupos: sistemas, bloques defensivos (bajo, medio, alto y repliegue), presión alta (al saque del portero con trampa en banda), transiciones (ataque-defensa y defensa-ataque), generar espacios (arrastre del 9, fijar y soltar, cambio de orientación, tercer hombre), ABP y ejercicios.
- Material de entrenamiento: conos, picas, vallas, aros, escalera, maniquíes, miniporterías, porterías y banderines, con giro de 45°.
- Sesiones sugeridas (`src/contenido/sessions.ts`): 25 sesiones de fútbol 11 de adultos con bloques, minutos y consignas, enlazadas a los ejercicios animados.
- Consejos (`src/contenido/tips.ts`): 126 consejos breves sobre sistemas, ataque, defensa, ABP, entrenamiento, gestión del grupo, análisis, posiciones, estrategia de partido, preparación física, cabeza y portero.
- Fundamentos (`src/contenido/fundamentos.ts`): las 4 fases, carriles y zonas, posiciones y dorsales, sistemas, bloques, principios de ataque y defensa y un diccionario, cada tema enlazado a su plantilla.
- Césped con corte profesional y botón Zonas para ver carriles y franjas del juego de posición.
- Instalable como app en el móvil y funciona sin conexión.
- Deshacer y rehacer, jugadas guardadas en el dispositivo y exportar a PNG (en Android abre el menú de compartir).

## Instalar en el móvil

La app se publica sola en GitHub Pages con cada cambio en `main` (`.github/workflows/deploy.yml`). Abre la dirección en Chrome del móvil y elige “Instalar aplicación”.

## Desarrollo

```bash
npm install
npm run dev          # servidor local
npm test             # pruebas automáticas (también se ejecutan antes de cada publicación)
npm run build        # versión de producción en dist/
npm run build:demo   # un único HTML autocontenido en dist-demo/
```

### Red de seguridad (antes de reordenar código)

Necesita Chromium con Playwright (en el equipo, no se instala con el proyecto).

```bash
npm run control:botones                              # comprueba lo que hace cada botón (17 comprobaciones)
npm run control:capturas -- --guardar <carpeta>      # 60 capturas: computador, celular de pie y de lado
npm run control:capturas -- --comparar <carpeta>     # las vuelve a sacar y avisa si cambia algún píxel
```

Si algo cambia, termina con error y deja las diferencias en rojo en `<carpeta>/diferencias`. Una rama puede añadir sus propias capturas y comprobaciones en `scripts/control-extra.mjs`.

Código, por carpetas (las coordenadas van en metros con el equipo local atacando hacia la derecha):
- `src/App.tsx`: une todas las piezas de la pizarra.
- `src/nucleo/`: datos y reglas sin pantalla: el modelo de la pizarra, pasos y animación, jugadas guardadas, copia de seguridad, preferencias, deshacer/rehacer y Mi identidad.
- `src/pantalla/`: lo que se ve: campo, fichas y trazos (`Pitch.tsx`, `Shapes.tsx`, `Scene.tsx`), material, `barras/`, `hojas/` y `campo/` (tocar, arrastrar y dibujar).
- `src/contenido/`: plantillas, sesiones, consejos, fundamentos y guía de uso.
- `src/exportar/`: vídeo e imagen.
- `src/i18n.ts` y `src/lang/`: idiomas.

Más detalle (reglas, enchufes y cómo comprobar antes de publicar) en [docs/MANUAL-TECNICO.md](docs/MANUAL-TECNICO.md).

## Próximas fases

2. Biblioteca de ejercicios. 3. Sesiones e IA. 4. Vídeo, cuentas de usuario y venta.
