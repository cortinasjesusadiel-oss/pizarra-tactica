# TacticalPro

Pizarra táctica de fútbol 11 pensada para el móvil y el S Pen, con plantillas de sistemas, acciones a balón parado (ABP) y ejercicios.

## Funciones

- Campo completo, medio campo y espacio reducido 40×30. En el móvil en vertical el campo gira solo para verse más grande.
- Fichas de jugadores local, rival y comodín, balón y conos. Tocar una ficha permite cambiar dorsal, equipo o eliminarla.
- Trazos: pase, carrera, conducción (línea ondulada), zona y dibujo libre, en 4 colores.
- S Pen: en modo Mover, el lápiz mueve la ficha que toca y dibuja si toca el césped; con una herramienta de dibujo elegida, siempre dibuja. El dedo mueve fichas. La presión cambia el grosor. El botón lateral borra. Se ignora la palma mientras el lápiz está apoyado.
- Animación continua y suave: las fichas siguen curvas que pasan por todos los pasos, sin paradas ni saltos. Reproducir, pausa, paso anterior y siguiente, explicación de cada paso. Puedes crear tus propias animaciones con “+ Paso”.
- Exportar varias jugadas a la vez (las animadas en vídeo y las demás en imagen) y marca de agua sutil configurable en el margen del campo.
- Exportar vídeo MP4 (1280×720, 30 imágenes por segundo) de cualquier jugada animada, con la explicación de cada paso. Se crea fotograma a fotograma, así sale fluido aunque el móvil vaya lento.
- Plantillas (63, 53 animadas) en grupos: sistemas, bloques defensivos (bajo, medio, alto y repliegue), presión alta (al saque del portero con trampa en banda), transiciones (ataque-defensa y defensa-ataque), generar espacios (arrastre del 9, fijar y soltar, cambio de orientación, tercer hombre), ABP y ejercicios.
- Material de entrenamiento: conos, picas, vallas, aros, escalera, maniquíes, miniporterías, porterías y banderines, con giro de 45°.
- Sesiones sugeridas (`src/sessions.ts`): 21 sesiones de fútbol 11 de adultos con bloques, minutos y consignas, enlazadas a los ejercicios animados.
- Consejos (`src/tips.ts`): 126 consejos breves sobre sistemas, ataque, defensa, ABP, entrenamiento, gestión del grupo, análisis, posiciones, estrategia de partido, preparación física, cabeza y portero.
- Fundamentos (`src/fundamentos.ts`): las 4 fases, carriles y zonas, posiciones y dorsales, sistemas, bloques, principios de ataque y defensa y un diccionario, cada tema enlazado a su plantilla.
- Césped con corte profesional y botón Zonas para ver carriles y franjas del juego de posición.
- Instalable como app en el móvil y funciona sin conexión.
- Deshacer y rehacer, jugadas guardadas en el dispositivo y exportar a PNG (en Android abre el menú de compartir).

## Instalar en el móvil

La app se publica sola en GitHub Pages con cada cambio en `main` (`.github/workflows/deploy.yml`). Abre la dirección en Chrome del móvil y elige “Instalar aplicación”.

## Desarrollo

```bash
npm install
npm run dev          # servidor local
npm run build        # versión de producción en dist/
npm run build:demo   # un único HTML autocontenido en dist-demo/
```

Código: `src/App.tsx` (pizarra e interacción), `src/Shapes.tsx` (fichas y trazos), `src/Pitch.tsx` (líneas del campo), `src/templates.ts` (plantillas), `src/storage.ts` (jugadas guardadas). Las coordenadas van en metros con el equipo local atacando hacia la derecha.

## Próximas fases

2. Biblioteca de ejercicios. 3. Sesiones e IA. 4. Vídeo, cuentas de usuario y venta.
