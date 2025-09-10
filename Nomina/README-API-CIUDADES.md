# 🏙️ Integración con API de Ciudades

## 📋 Instrucciones de Configuración

### 1. Configurar la URL de tu API

En el archivo `main.js`, busca esta línea:

```javascript
const API_URL = 'https://tu-api.com/ciudades';
```

**Reemplázala con la URL real de tu API.**

### 2. Ajustar el formato de datos

Las funciones están preparadas para manejar diferentes formatos de respuesta de API. Ajusta según tu caso:

#### Formato Esperado por Defecto:
```json
[
    { "id": 1, "name": "Bogotá" },
    { "id": 2, "name": "Medellín" }
]
```

#### Si tu API retorna formato diferente:

**Opción A: Objeto con propiedad data**
```json
{
    "data": [
        { "codigo": 1, "ciudad": "Bogotá" }
    ]
}
```

**Opción B: Diferentes nombres de propiedades**
```json
[
    { "id_ciudad": 1, "nombre_ciudad": "Bogotá" }
]
```

### 3. Modificar la función loadCitiesFromAPI

Si tu API tiene un formato diferente, modifica esta función en `main.js`:

```javascript
async function loadCitiesFromAPI(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // AJUSTA AQUÍ SEGÚN TU API:
        
        // Para formato simple (por defecto):
        return data;
        
        // Para formato con 'data':
        // return data.data;
        
        // Para formato con nombres diferentes:
        // return data.map(city => ({
        //     id: city.codigo,        // Ajusta el nombre del campo ID
        //     name: city.ciudad       // Ajusta el nombre del campo nombre
        // }));
        
    } catch (error) {
        console.error('Error cargando ciudades desde la API:', error);
        return [];
    }
}
```

### 4. Agregar autenticación (si es necesaria)

Si tu API requiere autenticación, modifica la función fetch:

```javascript
const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer tu-token',
        // o
        'X-API-Key': 'tu-api-key'
    }
});
```

## 🚀 Funcionalidades Implementadas

### 1. Carga Automática
- Las ciudades se cargan automáticamente cuando se carga la página
- El campo de texto se convierte en un select con las opciones de la API

### 2. Botón de Recarga
- Botón 🔄 junto al campo de ciudad
- Permite recargar las ciudades manualmente
- Útil si los datos cambian durante la sesión

### 3. Manejo de Errores
- Si la API falla, se mantiene el campo de texto original
- Mensajes de error claros para el usuario
- Logs en consola para debugging

### 4. Preservación de Valores
- Si había un valor seleccionado, se mantiene después de recargar
- Funciona tanto con selects como con inputs

## 🔧 Ejemplos de URLs de API Comunes

```javascript
// API REST simple
const API_URL = 'https://api.ejemplo.com/ciudades';

// API con parámetros
const API_URL = 'https://api.ejemplo.com/ubicaciones?tipo=ciudad&pais=CO';

// API local
const API_URL = 'http://localhost:3000/api/ciudades';

// API con versioning
const API_URL = 'https://api.ejemplo.com/v1/ciudades';
```

## 🐛 Solución de Problemas

### Error de CORS
Si obtienes errores de CORS, es porque tu API no permite peticiones desde el navegador. Soluciones:

1. **Configurar CORS en tu API** (recomendado)
2. **Usar un proxy** para las peticiones
3. **Hacer las peticiones desde tu backend**

### API no responde
1. Verifica la URL en el navegador
2. Revisa los headers requeridos
3. Confirma que la API esté funcionando con Postman o similar

### Datos no se muestran correctamente
1. Revisa la estructura de respuesta en la consola del navegador
2. Ajusta el mapeo de campos en la función `populateCitySelect`
3. Verifica que los campos `id` y `name` existan en tu respuesta

## 📝 Personalización Adicional

### Agregar filtros
```javascript
// Filtrar solo ciudades de un país específico
const cities = data.filter(city => city.pais === 'Colombia');
```

### Ordenar alfabéticamente
```javascript
// Ordenar ciudades por nombre
cities.sort((a, b) => a.name.localeCompare(b.name));
```

### Agregar ciudad por defecto
```javascript
// Agregar opción "Seleccionar ciudad" al inicio
const option = document.createElement('option');
option.value = '';
option.textContent = 'Seleccione una ciudad...';
selectElement.insertBefore(option, selectElement.firstChild);
```

## 📞 Soporte

Si necesitas ayuda con la configuración:

1. Proporciona la URL de tu API
2. Comparte un ejemplo de la respuesta JSON
3. Describe cualquier autenticación requerida

¡Y estaremos listos para ayudarte! 🚀
