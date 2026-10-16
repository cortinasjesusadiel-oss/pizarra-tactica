# Instalar el servidor de opiniones y «Me gusta» (5 minutos, gratis)

Todo queda en tu cuenta de Google **tacticalproapp@gmail.com**: la hoja de cálculo es tu panel privado y los avisos te llegan a ese correo.

1. Entra en Google con **tacticalproapp@gmail.com** y abre **sheets.new** (crea una hoja nueva). Ponle de nombre «TacticalPro · Opiniones».
2. En la hoja, menú **Extensiones → Apps Script**.
3. Borra el código que aparece y pega **todo** el contenido de `Code.gs`. Pulsa el icono del disquete para guardar.
4. Arriba, en el desplegable de funciones, elige **preparar** y pulsa **Ejecutar**.
   Google pedirá permisos: **Revisar permisos → tu cuenta → Configuración avanzada → Ir a … (no seguro) → Permitir**.
   Sale ese aviso porque el script es tuyo y no está verificado por Google; es normal. Pide permiso para usar esta hoja y enviar correos en tu nombre.
5. Arriba a la derecha: **Implementar → Nueva implementación**.
   - Tipo (icono de rueda): **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
6. Pega esa URL en el chat con Claude.

En la hoja verás dos pestañas: **Opiniones** (una fila por respuesta) y **Contador** (el total de «Me gusta» en la celda A2).
