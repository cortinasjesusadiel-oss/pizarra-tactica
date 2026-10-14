# Pizarra Táctica

Pizarra táctica de fútbol 11 pensada para el móvil y el S Pen, con plantillas de sistemas, acciones a balón parado (ABP) y ejercicios.

## Fase 1 (esta versión)

- Campo completo, medio campo y espacio reducido 40×30. En el móvil en vertical el campo gira solo para verse más grande.
- Fichas de jugadores local, rival y comodín, balón y conos. Tocar una ficha permite cambiar dorsal, equipo o eliminarla.
- Trazos: pase, carrera, conducción (línea ondulada), zona y dibujo libre, en 4 colores.
- S Pen: el lápiz dibuja con la herramienta elegida y el dedo mueve fichas. La presión cambia el grosor. El botón lateral borra. Se ignora la palma mientras el lápiz está apoyado.
- Plantillas: 4 enfrentamientos de sistemas, 5 ABP (córner a favor, córner en contra con defensa mixta, falta frontal con barrera, falta lateral y saque de banda largo) y 2 ejercicios.
- Deshacer y rehacer, jugadas guardadas en el dispositivo y exportar a PNG (en Android abre el menú de compartir).

## Desarrollo

```bash
npm install
npm run dev          # servidor local
npm run build        # versión de producción en dist/
npm run build:demo   # un único HTML autocontenido en dist-demo/
```

Código: `src/App.tsx` (pizarra e interacción), `src/Shapes.tsx` (fichas y trazos), `src/Pitch.tsx` (líneas del campo), `src/templates.ts` (plantillas), `src/storage.ts` (jugadas guardadas). Las coordenadas van en metros con el equipo local atacando hacia la derecha.

## Próximas fases

2. Animación por pasos y biblioteca de ejercicios. 3. Sesiones e IA. 4. Vídeo, cuentas de usuario y venta.
