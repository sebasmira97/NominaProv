// Configuración de API para ciudades
// Copia este archivo y ajusta los valores según tu API

const API_CONFIG = {
    // URL de tu API de ciudades
    CITIES_URL: 'https://api-v2.matias-api.com/api/ubl2.1/cities',
    
    // Headers adicionales si tu API los requiere
    HEADERS: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer tu-token', // Si requiere autenticación
        // 'X-API-Key': 'tu-api-key', // Si requiere API key
    },
    
    // Mapeo de campos de la respuesta de tu API
    FIELD_MAPPING: {
        id: 'id',                    // Campo que contiene el ID de la ciudad
        name: 'name_city'         // Campo que contiene el nombre de la ciudad         // Campo que contiene el código de la ciudad
    }
};

// Ejemplos de diferentes estructuras de respuesta de API:

/* 
EJEMPLO 1: API que retorna array simple
[
    { "id": 1, "nombre": "Bogotá" },
    { "id": 2, "nombre": "Medellín" }
]
Mapeo: { id: 'id', name: 'nombre' }

EJEMPLO 2: API que retorna objeto con data
{
    "data": [
        { "codigo": 1, "ciudad": "Bogotá" },
        { "codigo": 2, "ciudad": "Medellín" }
    ]
}
Mapeo: { id: 'codigo', name: 'ciudad' }
Necesitarás modificar la función para usar response.data

EJEMPLO 3: API con paginación
{
    "ciudades": [
        { "id_ciudad": 1, "nombre_ciudad": "Bogotá" },
        { "id_ciudad": 2, "nombre_ciudad": "Medellín" }
    ],
    "total": 100,
    "page": 1
}
Mapeo: { id: 'id_ciudad', name: 'nombre_ciudad' }
Necesitarás modificar la función para usar response.ciudades
*/

// Función personalizada para tu API específica
async function loadCitiesFromCustomAPI() {
    try {
        const response = await fetch(API_CONFIG.CITIES_URL, {
            method: 'GET',
            headers: API_CONFIG.HEADERS
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Extraer las ciudades de la estructura específica de tu API:
        // { "dataRecords": { "data": [ { "id": 1, "name_city": "Medellín", ... } ] } }
        let cities = responseData.dataRecords.data;
        
        // Mapear a formato estándar
        return cities.map(city => ({
            id: city[API_CONFIG.FIELD_MAPPING.id],
            name: city[API_CONFIG.FIELD_MAPPING.name]
        }));
        
    } catch (error) {
        console.error('Error cargando ciudades desde la API:', error);
        throw error;
    }
}

// Exportar configuración (si usas módulos)
// export { API_CONFIG, loadCitiesFromCustomAPI };
