// =============================================================================
// CONSTANTES DE REGULACIÓN LABORAL COLOMBIANA
// -----------------------------------------------------------------------------
// Única fuente de verdad de los porcentajes y bases de cálculo.
// Ante un cambio de normativa, este es el único bloque que se toca: el
// formulario se llena a partir de aquí (ver aplicarRecargosLegales) y los
// cálculos y el JSON leen de aquí.
//
// Vigencia: septiembre 2026
//   - Jornada de 42 h/semana (Ley 2101 de 2021, última reducción desde jul-2026)
//   - Recargo dominical/festivo al 90% (Ley 2466 de 2025; sube a 100% en jul-2027)
// =============================================================================
const REGULACION = {
    // Jornada
    HORAS_SEMANALES: 42,
    DIAS_SEMANA: 6,
    DIAS_MES: 30,

    // Recargos base
    RECARGO_NOCTURNO: 35,
    RECARGO_DOMINICAL: 90,   // jul-2025: 80 | jul-2026: 90 | jul-2027: 100

    // Horas extra
    EXTRA_DIURNA: 25,
    EXTRA_NOCTURNA: 75,

    // Aportes del trabajador
    PORCENTAJE_SALUD: 4,
    PORCENTAJE_PENSION: 4,

    // Intereses sobre cesantías: 12% anual sobre año comercial de 360 días
    INTERES_CESANTIAS_ANUAL: 12,
    DIAS_ANIO_COMERCIAL: 360
};

// Horas mensuales para el valor de la hora ordinaria: 42 / 6 x 30 = 210
REGULACION.HORAS_MES =
    (REGULACION.HORAS_SEMANALES / REGULACION.DIAS_SEMANA) * REGULACION.DIAS_MES;

// Porcentajes de cada concepto de hora extra / recargo.
// Los conceptos dominicales y festivos se derivan sumando RECARGO_DOMINICAL,
// así que cambiar ese único valor arriba los actualiza todos a la vez.
// Las claves coinciden con las clases del formulario (hed -> .hedPercentage).
const RECARGOS = {
    hed:   REGULACION.EXTRA_DIURNA,                                     // 25
    hen:   REGULACION.EXTRA_NOCTURNA,                                   // 75
    hrn:   REGULACION.RECARGO_NOCTURNO,                                 // 35
    hedf:  REGULACION.EXTRA_DIURNA     + REGULACION.RECARGO_DOMINICAL,  // 115
    hrdf:  REGULACION.RECARGO_DOMINICAL,                                // 90
    hendf: REGULACION.EXTRA_NOCTURNA   + REGULACION.RECARGO_DOMINICAL,  // 165
    hrndf: REGULACION.RECARGO_NOCTURNO + REGULACION.RECARGO_DOMINICAL   // 125
};

// Vuelca los porcentajes de ley sobre los campos del formulario.
// El HTML ya no los declara: se llenan desde RECARGOS al inicializar.
function aplicarRecargosLegales(employeeDiv) {
    Object.entries(RECARGOS).forEach(([concepto, porcentaje]) => {
        const input = employeeDiv.querySelector(`.${concepto}Percentage`);
        if (input) {
            input.value = porcentaje;
            input.placeholder = porcentaje;
        }
    });

    const aportes = [
        ['.healthPercentage', REGULACION.PORCENTAJE_SALUD],
        ['.pensionPercentage', REGULACION.PORCENTAJE_PENSION]
    ];

    aportes.forEach(([selector, porcentaje]) => {
        const input = employeeDiv.querySelector(selector);
        if (input) {
            input.value = porcentaje;
            input.placeholder = porcentaje;
        }
    });
}

let employeeCount = 0;

// Función para cargar ciudades desde la API
async function loadCitiesFromAPI(apiUrl) {
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Extraer ciudades de la estructura específica: dataRecords.data
        const cities = responseData.dataRecords?.data || [];
        
        // Mapear a formato estándar con información completa
        return cities.map(city => ({
            id: city.id,
            name: city.name_city
        }));
        
    } catch (error) {
        console.error('Error cargando ciudades desde la API:', error);
        alert('❌ Error al cargar las ciudades desde la API. Verifique la conexión.');
        return [];
    }
}

// Función para poblar el select de ciudades
function populateCitySelect(cities, selectElement) {
    // Limpiar opciones existentes
    selectElement.innerHTML = '<option value="">Seleccione una ciudad...</option>';
    
    cities.forEach(city => {
        const option = document.createElement('option');
        // Usar el ID como valor
        option.value = city.id;
        option.textContent = city.name;
        selectElement.appendChild(option);
    });
}

// Función para convertir input de ciudad a select con datos de la API
async function convertCityInputToSelect(apiUrl) {
    const cityInput = document.getElementById('generationCityId');
    if (!cityInput) return;
    
    // Crear nuevo select
    const citySelect = document.createElement('select');
    citySelect.id = 'generationCityId';
    citySelect.className = cityInput.className;
    citySelect.style.cssText = cityInput.style.cssText;
    
    // Mantener el valor actual como opción por defecto
    const currentValue = cityInput.value;
    
    // Cargar ciudades desde la API
    const cities = await loadCitiesFromAPI(apiUrl);
    
    if (cities.length > 0) {
        populateCitySelect(cities, citySelect);
        
        // Si había un valor previo, intentar seleccionarlo
        if (currentValue) {
            const matchingOption = Array.from(citySelect.options).find(
                option => option.value === currentValue
            );
            if (matchingOption) {
                citySelect.value = currentValue;
            }
        }
        
        // Reemplazar input por select
        cityInput.parentNode.replaceChild(citySelect, cityInput);
        
        console.log('✅ Campo de ciudad convertido a select con datos de la API');
    } else {
        console.warn('⚠️ No se pudieron cargar ciudades de la API, manteniendo input original');
    }
}

// Función genérica para cargar ciudades en cualquier select
async function setupCitySelect(selectElement, apiUrl, defaultValue = null) {
    const cities = await loadCitiesFromAPI(apiUrl);
    
    if (cities.length > 0) {
        populateCitySelect(cities, selectElement);
        
        if (defaultValue) {
            selectElement.value = defaultValue;
        }
    }
}

// Función para probar la conexión con la API
async function testAPIConnection() {
    const API_URL = 'https://api-v2.matias-api.com/api/ubl2.1/cities';
    
    try {
        console.log('🔍 Probando conexión con la API...');
        const cities = await loadCitiesFromAPI(API_URL);
        
        if (cities.length > 0) {
            console.log('✅ API conectada exitosamente!');
            console.log(`📊 Se encontraron ${cities.length} ciudades`);
            console.log('🏙️ Ejemplos de ciudades:', cities.slice(0, 3));
            return true;
        } else {
            console.warn('⚠️ API conectada pero no devolvió ciudades');
            return false;
        }
    } catch (error) {
        console.error('❌ Error conectando con la API:', error);
        return false;
    }
}

// Función para llamar desde la consola del navegador para debug
window.testAPI = testAPIConnection;
window.reloadCities = reloadCities;

function reloadCities() {
    if (typeof convertCityInputToSelect === 'function') {
        convertCityInputToSelect(API_CONFIG?.CITIES_URL || 'https://api-v2.matias-api.com/api/ubl2.1/cities');
    } else {
        console.log('Recargando ciudades...');
    }
}

function reloadWorkCities() {
    const workCitySelect = document.getElementById('workCityId');
    if (workCitySelect && typeof setupCitySelect === 'function') {
        setupCitySelect(workCitySelect, API_CONFIG?.CITIES_URL || 'https://api-v2.matias-api.com/api/ubl2.1/cities');
    } else {
        console.log('Recargando ciudades de trabajo...');
    }
}

// Configuración de cálculos automáticos
function setupCalculations(employeeDiv) {
    const salaryInput = employeeDiv.querySelector('.salary');
    const workedDaysInput = employeeDiv.querySelector('.workedDays');
    const salaryWorkedInput = employeeDiv.querySelector('.salaryWorked');
    const healthPercentageInput = employeeDiv.querySelector('.healthPercentage');
    const healthDeductionInput = employeeDiv.querySelector('.healthDeduction');
    const pensionPercentageInput = employeeDiv.querySelector('.pensionPercentage');
    const pensionDeductionInput = employeeDiv.querySelector('.pensionDeduction');
    
    // Campos para todos los tipos de horas extras
    const hedAmountInput = employeeDiv.querySelector('.hedAmount');
    const hedPercentageInput = employeeDiv.querySelector('.hedPercentage');
    const hedPaymentInput = employeeDiv.querySelector('.hedPayment');
    
    const henAmountInput = employeeDiv.querySelector('.henAmount');
    const henPercentageInput = employeeDiv.querySelector('.henPercentage');
    const henPaymentInput = employeeDiv.querySelector('.henPayment');
    
    const hedfAmountInput = employeeDiv.querySelector('.hedfAmount');
    const hedfPercentageInput = employeeDiv.querySelector('.hedfPercentage');
    const hedfPaymentInput = employeeDiv.querySelector('.hedfPayment');
    
    const hrnAmountInput = employeeDiv.querySelector('.hrnAmount');
    const hrnPercentageInput = employeeDiv.querySelector('.hrnPercentage');
    const hrnPaymentInput = employeeDiv.querySelector('.hrnPayment');
    
    const hrdfAmountInput = employeeDiv.querySelector('.hrdfAmount');
    const hrdfPercentageInput = employeeDiv.querySelector('.hrdfPercentage');
    const hrdfPaymentInput = employeeDiv.querySelector('.hrdfPayment');
    
    const hendfAmountInput = employeeDiv.querySelector('.hendfAmount');
    const hendfPercentageInput = employeeDiv.querySelector('.hendfPercentage');
    const hendfPaymentInput = employeeDiv.querySelector('.hendfPayment');
    
    const hrndfAmountInput = employeeDiv.querySelector('.hrndfAmount');
    const hrndfPercentageInput = employeeDiv.querySelector('.hrndfPercentage');
    const hrndfPaymentInput = employeeDiv.querySelector('.hrndfPayment');
    
    // Campos de cesantías
    const cesantiasPaymentInput = employeeDiv.querySelector('.cesantiasPayment');
    const workedDaysCesantiasInput = employeeDiv.querySelector('.workedDaysCesantias');
    const cesantiasPorcentageInput = employeeDiv.querySelector('.cesantiasPorcentage');
    const cesantiasInterestInput = employeeDiv.querySelector('.cesantiasInterest');
    
    // Campos de vacaciones
    const vacationTimeDaysInput = employeeDiv.querySelector('.vacationTimeDays');
    const vacationTimePaymentInput = employeeDiv.querySelector('.vacationTimePayment');
    const vacationPaidDaysInput = employeeDiv.querySelector('.vacationPaidDays');
    const vacationPaidPaymentInput = employeeDiv.querySelector('.vacationPaidPayment');

    function calculateAll() {
        const salary = parseFloat(salaryInput?.value) || 0;
        const workedDays = parseFloat(workedDaysInput?.value) || REGULACION.DIAS_MES;
        const healthPercentage = parseFloat(healthPercentageInput?.value) || REGULACION.PORCENTAJE_SALUD;
        const pensionPercentage = parseFloat(pensionPercentageInput?.value) || REGULACION.PORCENTAJE_PENSION;

        // Calcular salario trabajado
        const salaryWorked = salary > 0 ? Math.round((salary / REGULACION.DIAS_MES) * workedDays) : 0;
        if (salaryWorkedInput) salaryWorkedInput.value = salaryWorked;

        // Valor de la hora ordinaria según la jornada legal vigente
        const valorHora = salary > 0 ? salary / REGULACION.HORAS_MES : 0;

        // Calcular todas las horas extras
        const calculations = [
            { amount: hedAmountInput, percentage: hedPercentageInput, payment: hedPaymentInput, defaultPercent: RECARGOS.hed, type: 'extra' },
            { amount: henAmountInput, percentage: henPercentageInput, payment: henPaymentInput, defaultPercent: RECARGOS.hen, type: 'extra' },
            { amount: hedfAmountInput, percentage: hedfPercentageInput, payment: hedfPaymentInput, defaultPercent: RECARGOS.hedf, type: 'extra' },
            { amount: hrnAmountInput, percentage: hrnPercentageInput, payment: hrnPaymentInput, defaultPercent: RECARGOS.hrn, type: 'recargo' },
            { amount: hrdfAmountInput, percentage: hrdfPercentageInput, payment: hrdfPaymentInput, defaultPercent: RECARGOS.hrdf, type: 'recargo' },
            { amount: hendfAmountInput, percentage: hendfPercentageInput, payment: hendfPaymentInput, defaultPercent: RECARGOS.hendf, type: 'extra' },
            { amount: hrndfAmountInput, percentage: hrndfPercentageInput, payment: hrndfPaymentInput, defaultPercent: RECARGOS.hrndf, type: 'recargo' }
        ];

        calculations.forEach(calc => {
            const amount = parseFloat(calc.amount?.value) || 0;
            const percentage = parseFloat(calc.percentage?.value) || calc.defaultPercent;
            let payment = 0;
            
            if (amount > 0 && valorHora > 0) {
                if (calc.type === 'extra') {
                    payment = Math.round(valorHora * (1 + percentage / 100) * amount);
                } else { // recargo
                    payment = Math.round(valorHora * (percentage / 100) * amount);
                }
            }
            
            if (calc.payment) calc.payment.value = payment;
        });
        
        // Calcular deducciones sobre salario trabajado
        const healthDeduction = Math.round(salaryWorked * healthPercentage / 100);
        const pensionDeduction = Math.round(salaryWorked * pensionPercentage / 100);
        
        if (healthDeductionInput) healthDeductionInput.value = healthDeduction;
        if (pensionDeductionInput) pensionDeductionInput.value = pensionDeduction;
        
        // Calcular vacaciones (salario base diario = salario / días del mes)
        const salarioDiario = salary > 0 ? salary / REGULACION.DIAS_MES : 0;
        
        // Vacaciones en tiempo
        const vacationTimeDays = parseFloat(vacationTimeDaysInput?.value) || 0;
        const vacationTimePayment = vacationTimeDays > 0 ? Math.round(salarioDiario * vacationTimeDays) : 0;
        if (vacationTimePaymentInput) vacationTimePaymentInput.value = vacationTimePayment;
        
        // Vacaciones compensadas en dinero
        const vacationPaidDays = parseFloat(vacationPaidDaysInput?.value) || 0;
        const vacationPaidPayment = vacationPaidDays > 0 ? Math.round(salarioDiario * vacationPaidDays) : 0;
        if (vacationPaidPaymentInput) vacationPaidPaymentInput.value = vacationPaidPayment;
        
        // Calcular intereses de cesantías (12% anual sobre el valor de cesantías)
        // Los intereses se calculan proporcionalmente según los días trabajados
        const cesantiasPayment = parseFloat(cesantiasPaymentInput?.value) || 0;
        const diasTrabajados = parseFloat(workedDaysCesantiasInput?.value) || 0;

        let cesantiasPorcentageCalculated = 0;
        let cesantiasInterestCalculated = 0;

        if (cesantiasPayment > 0 && diasTrabajados > 0) {

            // porcentaje aplicado (ej: 4.00, 6.00, 12.00)
            cesantiasPorcentageCalculated =
                (diasTrabajados * REGULACION.INTERES_CESANTIAS_ANUAL) / REGULACION.DIAS_ANIO_COMERCIAL;

            // intereses
            cesantiasInterestCalculated = Math.round(
                cesantiasPayment * cesantiasPorcentageCalculated / 100
            );
        }

        // Guardar resultados
        if (cesantiasInterestInput) {
            cesantiasInterestInput.value = cesantiasInterestCalculated;
        }

        if (cesantiasPorcentageInput) {
            cesantiasPorcentageInput.value = cesantiasPorcentageCalculated.toFixed(2);
        }
        
        // Actualizar resumen después de calcular
        setTimeout(updatePaymentSummary, 100);
    }

    // Eventos para recalcular automáticamente
    const allInputs = [
        salaryInput, workedDaysInput, healthPercentageInput, pensionPercentageInput,
        hedAmountInput, hedPercentageInput, henAmountInput, henPercentageInput,
        hedfAmountInput, hedfPercentageInput, hrnAmountInput, hrnPercentageInput,
        hrdfAmountInput, hrdfPercentageInput, hendfAmountInput, hendfPercentageInput,
        hrndfAmountInput, hrndfPercentageInput, cesantiasPaymentInput, workedDaysCesantiasInput,
        vacationTimeDaysInput, vacationPaidDaysInput
    ];

    allInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', calculateAll);
        }
    });

    // Llenar los porcentajes de ley antes del primer cálculo
    aplicarRecargosLegales(employeeDiv);

    // Calcular inicialmente
    calculateAll();
}

// Función para convertir input de ciudad de trabajo a select con datos de la API
async function convertWorkCityInputToSelect(apiUrl) {
    const workCityInput = document.getElementById('workCityId');
    if (!workCityInput) return;
    // Crear nuevo select
    const workCitySelect = document.createElement('select');
    workCitySelect.id = 'workCityId';
    workCitySelect.className = workCityInput.className;
    workCitySelect.style.cssText = workCityInput.style.cssText;
    // Mantener el valor actual como opción por defecto
    const currentValue = workCityInput.value;
    // Cargar ciudades desde la API
    const cities = await loadCitiesFromAPI(apiUrl);
    
    if (cities.length > 0) {
        populateCitySelect(cities, workCitySelect);
        // Si había un valor previo, intentar seleccionarlo
        if (currentValue) {
            const matchingOption = Array.from(workCitySelect.options).find(
                option => option.value === currentValue
            );
            if (matchingOption) {
                workCitySelect.value = currentValue;
            }
        }
        // Reemplazar input por select
        workCityInput.parentNode.replaceChild(workCitySelect, workCityInput);
        
        console.log('✅ Campo de ciudad de trabajo convertido a select con datos de la API');
    } else {
        console.warn('⚠️ No se pudieron cargar ciudades de la API para ciudad de trabajo, manteniendo input original');
    }
}

// Función para recargar ciudades de trabajo manualmente
async function reloadWorkCities() {
    const API_URL = 'https://api-v2.matias-api.com/api/ubl2.1/cities';
    try {
        const workCityElement = document.getElementById('workCityId');
        const currentValue = workCityElement.value;
        const reloadBtn = workCityElement.parentNode.querySelector('.btn-reload');
        if (reloadBtn) {
            reloadBtn.innerHTML = '⏳';
            reloadBtn.disabled = true;
        }
        if (workCityElement.tagName.toLowerCase() === 'select') {
            const tempInput = document.createElement('input');
            tempInput.type = 'text';
            tempInput.id = 'workCityId';
            tempInput.className = workCityElement.className;
            tempInput.style.cssText = workCityElement.style.cssText;
            tempInput.value = currentValue;
            tempInput.placeholder = 'Medellín';
            workCityElement.parentNode.replaceChild(tempInput, workCityElement);
        }
        await convertWorkCityInputToSelect(API_URL);
        if (reloadBtn) {
            reloadBtn.innerHTML = '🔄';
            reloadBtn.disabled = false;
        }
        alert('✅ Ciudades de trabajo recargadas exitosamente desde la API');
    } catch (error) {
        console.error('Error recargando ciudades de trabajo:', error);
        alert('❌ Error al recargar las ciudades de trabajo. Verifique la conexión.');
        const reloadBtn = document.querySelector('#workCityId ~ .btn-reload');
        if (reloadBtn) {
            reloadBtn.innerHTML = '🔄';
            reloadBtn.disabled = false;
        }
    }
}

// Función opcional para manejar ciudades de trabajo en empleados
async function setupWorkCitiesForEmployees(apiUrl = 'https://api-v2.matias-api.com/api/ubl2.1/cities') {
    // Esta función se puede llamar cuando se agreguen nuevos empleados
    const workCityInputs = document.querySelectorAll('.workCityId');
    
    for (const input of workCityInputs) {
        if (input.tagName.toLowerCase() === 'input') {
            const select = document.createElement('select');
            select.className = input.className;
            select.style.cssText = input.style.cssText;
            
            const currentValue = input.value;
            const cities = await loadCitiesFromAPI(apiUrl);
            
            if (cities.length > 0) {
                populateCitySelect(cities, select);
                if (currentValue) {
                    select.value = currentValue;
                }
                input.parentNode.replaceChild(select, input);
            }
        }
    }
}

// Función para recargar ciudades manualmente
async function reloadCities() {
    const API_URL = 'https://api-v2.matias-api.com/api/ubl2.1/cities';
    
    try {
        const cityElement = document.getElementById('generationCityId');
        const currentValue = cityElement.value;
        
        // Mostrar indicador de carga
        const reloadBtn = document.querySelector('.btn-reload');
        if (reloadBtn) {
            reloadBtn.innerHTML = '⏳';
            reloadBtn.disabled = true;
        }
        
        // Si es un select, convertir a input temporalmente
        if (cityElement.tagName.toLowerCase() === 'select') {
            const tempInput = document.createElement('input');
            tempInput.type = 'text';
            tempInput.id = 'generationCityId';
            tempInput.className = cityElement.className;
            tempInput.style.cssText = cityElement.style.cssText;
            tempInput.value = currentValue;
            tempInput.placeholder = '836';
            
            cityElement.parentNode.replaceChild(tempInput, cityElement);
        }
        
        // Cargar ciudades nuevamente
        await convertCityInputToSelect(API_URL);
        
        // Restaurar botón
        if (reloadBtn) {
            reloadBtn.innerHTML = '🔄';
            reloadBtn.disabled = false;
        }
        
        alert('✅ Ciudades recargadas exitosamente desde la API');
        
    } catch (error) {
        console.error('Error recargando ciudades:', error);
        alert('❌ Error al recargar las ciudades. Verifique la conexión.');
        
        // Restaurar botón en caso de error
        const reloadBtn = document.querySelector('.btn-reload');
        if (reloadBtn) {
            reloadBtn.innerHTML = '🔄';
            reloadBtn.disabled = false;
        }
    }
}

// Función para actualizar tiempo trabajado según el período
function updateTimeWorkedByPeriod() {
    const periodSelect = document.getElementById('periodId');
    const timeWorkedInput = document.getElementById('timeWorked');
    const workedDaysInputs = document.querySelectorAll('.workedDays');
    
    if (!periodSelect || !timeWorkedInput) return;
    
    const periodValue = periodSelect.value;
    let defaultDays = 30; // Valor por defecto
    
    switch(periodValue) {
        case '1': // Diario
            defaultDays = 1;
            break;
        case '2': // Semanal
            defaultDays = 7;
            break;
        case '3': // Decenal
            defaultDays = 10;
            break;
        case '4': // Quincenal
            defaultDays = 15;
            break;
        case '5': // Mensual
            defaultDays = 30;
            break;
        case '6': // Otro (acuerdo especial)
            defaultDays = 30; // Mantener el valor actual o usar 30 por defecto
            break;
    }
    
    // Actualizar el campo "Tiempo Trabajado"
    timeWorkedInput.value = defaultDays;
    
    // También actualizar todos los campos "Días Trabajados" de empleados
    workedDaysInputs.forEach(input => {
        input.value = defaultDays;
        // Disparar evento para recalcular salarios
        input.dispatchEvent(new Event('input'));
    });
}

// Evento para detectar cambios en el período
document.addEventListener('DOMContentLoaded', function() {
    const periodSelect = document.getElementById('periodId');
    
    if (periodSelect) {
        // Configurar el valor inicial
        updateTimeWorkedByPeriod();
        
        // Escuchar cambios en el select de período
        periodSelect.addEventListener('change', updateTimeWorkedByPeriod);
    }
    
    // Inicializar ciudades desde la API
    initializeCities();

    // Inicializar cálculos automáticos para el único empleado
    const unicoEmpleado = document.querySelector('.employee-section');
    if (unicoEmpleado) {
        setupCalculations(unicoEmpleado);
    }
});

// Función para inicializar las ciudades
async function initializeCities() {
    const API_URL = 'https://api-v2.matias-api.com/api/ubl2.1/cities';
    try {
        // Ciudad de Generación
        await convertCityInputToSelect(API_URL);
        // Ciudad de Trabajo
        await convertWorkCityInputToSelect(API_URL);
    } catch (error) {
        console.error('Error inicializando ciudades:', error);
    }
}

// Auto-actualizar vista previa cuando cambian los datos
document.addEventListener('input', function(e) {
    if (e.target.matches('input, select')) {
        setTimeout(updatePreview, 500);
    }
});

// Inicializar fechas con valores por defecto
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    document.getElementById('payDay').value = today;
    document.getElementById('generationDate').value = today;
    document.getElementById('dateEntry').value = '2017-01-01';
    document.getElementById('settlementStartDate').value = firstDay;
    document.getElementById('settlementEndDate').value = lastDay;
    
    // Inicializar ciudades desde la API
    initializeCities();

    // Inicializar cálculos automáticos para el único empleado
    const unicoEmpleado = document.querySelector('.employee-section');
    if (unicoEmpleado) {
        setupCalculations(unicoEmpleado);
    }
});

// Función para actualizar resumen
document.addEventListener('input', function(e) {
    if (e.target.matches('input[type="number"], input[type="text"]')) {
        setTimeout(updatePaymentSummary, 100);
    }
});

// Inicializar resumen al cargar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updatePaymentSummary, 500);
});

// Función para manejar cambios en el medio de pago
function handlePaymentMethodChange() {
    const meansPaymentSelect = document.querySelector('.meansPaymentId');
    const bankInput = document.querySelector('.bank');
    const accountNumberInput = document.querySelector('.accountNumber');
    const accountTypeSelect = document.querySelector('.accountType');
    const bankRequired = document.querySelector('.bank-required');
    const accountRequired = document.querySelector('.account-required');
    
    if (!meansPaymentSelect) return;
    
    const selectedValue = meansPaymentSelect.value;
    
    if (selectedValue === '10') { // Efectivo
        if (bankInput) {
            bankInput.value = 'NO APLICA';
            bankInput.readOnly = true;
            bankInput.removeAttribute('required');
            bankInput.style.backgroundColor = '#f5f5f5';
        }
        
        if (accountNumberInput) {
            accountNumberInput.value = '00000';
            accountNumberInput.readOnly = true;
            accountNumberInput.removeAttribute('required');
            accountNumberInput.style.backgroundColor = '#f5f5f5';
        }
        
        if (accountTypeSelect) {
            accountTypeSelect.value = 'AHORROS';
            accountTypeSelect.disabled = true;
            accountTypeSelect.style.backgroundColor = '#f5f5f5';
        }
        
        if (bankRequired) bankRequired.style.display = 'none';
        if (accountRequired) accountRequired.style.display = 'none';
        
    } else { // Débito bancario
        if (bankInput) {
            bankInput.value = '';
            bankInput.readOnly = false;
            bankInput.setAttribute('required', '');
            bankInput.style.backgroundColor = '';
            bankInput.placeholder = 'Bancolombia';
        }
        
        if (accountNumberInput) {
            accountNumberInput.value = '';
            accountNumberInput.readOnly = false;
            accountNumberInput.setAttribute('required', '');
            accountNumberInput.style.backgroundColor = '';
            accountNumberInput.placeholder = '123456789';
        }
        
        if (accountTypeSelect) {
            accountTypeSelect.disabled = false;
            accountTypeSelect.style.backgroundColor = '';
        }
        
        if (bankRequired) bankRequired.style.display = 'inline';
        if (accountRequired) accountRequired.style.display = 'inline';
    }
}

// Evento para detectar cambios en el medio de pago
document.addEventListener('DOMContentLoaded', function() {
    // Configurar evento para medio de pago
    const meansPaymentSelect = document.querySelector('.meansPaymentId');
    if (meansPaymentSelect) {
        meansPaymentSelect.addEventListener('change', handlePaymentMethodChange);
        
        // Aplicar configuración inicial
        handlePaymentMethodChange();
    }
});

// Función para actualizar el resumen de pagos
function updatePaymentSummary() {
    const employeeDiv = document.querySelector('.employee-section');
    if (!employeeDiv) return;

    const getNumVal = (selector) => {
        const element = employeeDiv.querySelector(selector);
        return parseFloat(element?.value) || 0;
    };

    // Devengados
    const salaryWorked = getNumVal('.salaryWorked');
    
    // Todas las horas extras
    const hedPayment = getNumVal('.hedPayment');
    const henPayment = getNumVal('.henPayment');
    const hedfPayment = getNumVal('.hedfPayment');
    const hrnPayment = getNumVal('.hrnPayment');
    const hrdfPayment = getNumVal('.hrdfPayment');
    const hendfPayment = getNumVal('.hendfPayment');
    const hrndfPayment = getNumVal('.hrndfPayment');
    
    const totalOvertime = hedPayment + henPayment + hedfPayment + hrnPayment + hrdfPayment + hendfPayment + hrndfPayment;
    
    const transportationAssistance = getNumVal('.transportationAssistance');
    const viaticMaintenance = getNumVal('.viaticMaintenance');
    const viaticNonSalary = getNumVal('.viaticNonSalary');
    const bonusPayment = getNumVal('.bonusPayment');
    const primePayment = getNumVal('.primePayment');
    const commission = getNumVal('.commission');
    const conceptS = getNumVal('.conceptS');
    const cesantiasPayment = getNumVal('.cesantiasPayment');
    const cesantiasInterest = getNumVal('.cesantiasInterest');
    const vacationPaidPayment = getNumVal('.vacationPaidPayment');
    
    // Verificar si es retiro/liquidación
    const isRetirement = document.getElementById('isRetirement')?.checked || false;
    
    // Las cesantías solo se suman al total cuando es retiro (liquidación directa al empleado)
    const cesantiasTotal = isRetirement ? cesantiasPayment : 0;
    const otherConcepts = bonusPayment + primePayment + commission + conceptS + cesantiasInterest + vacationPaidPayment + viaticMaintenance + viaticNonSalary + cesantiasTotal;
    const totalEarned = salaryWorked + totalOvertime + transportationAssistance + otherConcepts;

    // Deducciones
    const healthDeduction = getNumVal('.healthDeduction');
    const pensionDeduction = getNumVal('.pensionDeduction');
    const thirdPartyPay = getNumVal('.thirdPartyPay');
    const otherDeduction = getNumVal('.otherDeduction');
    const otherDeductions = thirdPartyPay + otherDeduction;
    const totalDeductions = healthDeduction + pensionDeduction + otherDeductions;

    // Neto a pagar
    const netPay = totalEarned - totalDeductions;

    // Actualizar resumen
    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(value);

    // Actualizar elementos si existen
    const summaryElements = {
        '.summary-salaryWorked': salaryWorked,
        '.summary-overtime': totalOvertime,
        '.summary-transport': transportationAssistance,
        '.summary-others': otherConcepts,
        '.summary-totalEarned': totalEarned,
        '.summary-health': healthDeduction,
        '.summary-pension': pensionDeduction,
        '.summary-otherDeductions': otherDeductions,
        '.summary-totalDeductions': totalDeductions,
        '.summary-netPay': netPay
    };

    Object.entries(summaryElements).forEach(([selector, value]) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = formatCurrency(value);
        }
    });
}

// Función para validar campos obligatorios
function validateRequiredFields() {
    const meansPaymentSelect = document.querySelector('.meansPaymentId');
    const isEffectivo = meansPaymentSelect?.value === '10';
    
    let requiredSelectors = [
        '.documentNumber',
        '.firstName', 
        '.firstSurname',
        '.salary',
        '.workerCode',
        '.workAddress'
    ];
    
    if (!isEffectivo) {
        requiredSelectors.push('.bank', '.accountNumber');
    }

    let isValid = true;
    const errors = [];

    requiredSelectors.forEach(selector => {
        const field = document.querySelector(selector);
        const formGroup = field?.closest('.form-group');
        
        if (field && formGroup) {
            formGroup.classList.remove('has-error');
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) existingError.remove();

            if (!field.readOnly && !field.value.trim()) {
                isValid = false;
                const fieldName = field.closest('.form-group').querySelector('label').textContent.replace('*', '').trim();
                errors.push(fieldName);
                
                formGroup.classList.add('has-error');
                const errorMsg = document.createElement('span');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'Este campo es obligatorio';
                field.parentNode.appendChild(errorMsg);
            }
        }
    });

    return { isValid, errors };
}

// Función principal para generar el JSON del empleado
function generateEmployeeJSON() {
    const employeeDiv = document.querySelector('.employee-section');
    if (!employeeDiv) return null;

    const getVal = (selector, defaultVal = '') => {
        const element = employeeDiv.querySelector(selector);
        return element ? element.value.trim() : defaultVal;
    };
    
    const getNumVal = (selector, defaultVal = 0) => {
        const val = parseFloat(getVal(selector));
        return isNaN(val) ? defaultVal : val;
    };

    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().split(' ')[0];
    };

    const timeNow = getCurrentTime();
    
    // Datos básicos
    const salary = getNumVal('.salary');
    const workedDays = getNumVal('.workedDays', REGULACION.DIAS_MES);
    
    // Todas las horas extras
    const hedAmount = getNumVal('.hedAmount');
    const hedPercentage = getNumVal('.hedPercentage', RECARGOS.hed);
    const hedPayment = getNumVal('.hedPayment');
    
    const henAmount = getNumVal('.henAmount');
    const henPercentage = getNumVal('.henPercentage', RECARGOS.hen);
    const henPayment = getNumVal('.henPayment');
    
    const hedfAmount = getNumVal('.hedfAmount');
    const hedfPercentage = getNumVal('.hedfPercentage', RECARGOS.hedf);
    const hedfPayment = getNumVal('.hedfPayment');
    
    const hrnAmount = getNumVal('.hrnAmount');
    const hrnPercentage = getNumVal('.hrnPercentage', RECARGOS.hrn);
    const hrnPayment = getNumVal('.hrnPayment');
    
    const hrdfAmount = getNumVal('.hrdfAmount');
    const hrdfPercentage = getNumVal('.hrdfPercentage', RECARGOS.hrdf);
    const hrdfPayment = getNumVal('.hrdfPayment');
    
    const hendfAmount = getNumVal('.hendfAmount');
    const hendfPercentage = getNumVal('.hendfPercentage', RECARGOS.hendf);
    const hendfPayment = getNumVal('.hendfPayment');
    
    const hrndfAmount = getNumVal('.hrndfAmount');
    const hrndfPercentage = getNumVal('.hrndfPercentage', RECARGOS.hrndf);
    const hrndfPayment = getNumVal('.hrndfPayment');
    
    // Otros conceptos
    const transportationAssistance = getNumVal('.transportationAssistance');
    const viaticMaintenance = getNumVal('.viaticMaintenance');
    const viaticNonSalary = getNumVal('.viaticNonSalary');
    const bonusPayment = getNumVal('.bonusPayment');
    const primePayment = getNumVal('.primePayment');
    const commission = getNumVal('.commission');
    const conceptS = getNumVal('.conceptS');
    const cesantiasPayment = getNumVal('.cesantiasPayment');
    const cesantiasPorcentage = getNumVal('.cesantiasPorcentage');
    const cesantiasInterest = getNumVal('.cesantiasInterest');
    
    // Vacaciones
    const vacationTimeDays = getNumVal('.vacationTimeDays');
    const vacationTimePayment = getNumVal('.vacationTimePayment');
    const vacationPaidDays = getNumVal('.vacationPaidDays');
    const vacationPaidPayment = getNumVal('.vacationPaidPayment');
    const vacationTimeStartDate = getVal('.vacationTimeStartDate', '2021-12-31');
    const vacationTimeEndDate = getVal('.vacationTimeEndDate', '2021-12-31');
    
    // Calcular totales
    const totalOvertimePayment = hedPayment + henPayment + hedfPayment + hrnPayment + hrdfPayment + hendfPayment + hrndfPayment;
    const salaryWorked = getNumVal('.salaryWorked');
    
    // Verificar si es retiro/liquidación
    const isRetirement = document.getElementById('isRetirement')?.checked || false;
    
    // Las cesantías solo se incluyen en el total cuando es retiro (liquidación directa al empleado)
    const cesantiasTotal = isRetirement ? cesantiasPayment : 0;
    const totalEarned = salaryWorked + transportationAssistance + totalOvertimePayment + bonusPayment + primePayment + commission + conceptS + cesantiasInterest + vacationPaidPayment + viaticMaintenance + viaticNonSalary + cesantiasTotal;
    
    // Deducciones
    const healthDeduction = getNumVal('.healthDeduction');
    const pensionDeduction = getNumVal('.pensionDeduction');
    const thirdPartyPay = getNumVal('.thirdPartyPay');
    const otherDeduction = getNumVal('.otherDeduction');
    
    const totalDeductions = healthDeduction + pensionDeduction + thirdPartyPay + otherDeduction;
    const totalVoucher = totalEarned - totalDeductions;

    return {
        "resolution_number": document.getElementById('resolutionNumber')?.value || "18760000001",
        "document_number": document.getElementById('documentNumber')?.value || "27",
        "generation_city_id": document.getElementById('generationCityId')?.value || "1",
        "worker_code": getVal('.workerCode'),
        "novelty": isRetirement,
        "pay_day": document.getElementById('payDay')?.value || new Date().toISOString().split('T')[0],
        "period": {
            "date_entry": document.getElementById('dateEntry')?.value || "",
            "departure_date": document.getElementById('departureDate')?.value || null,
            "settlement_start_date": document.getElementById('settlementStartDate')?.value || new Date().toISOString().split('T')[0],
            "settlement_end_date": document.getElementById('settlementEndDate')?.value || new Date().toISOString().split('T')[0],
            "time_worked": document.getElementById('timeWorked')?.value || "30",
            "generation_date": document.getElementById('generationDate')?.value || new Date().toISOString().split('T')[0]
        },
        "general_information": {
            "generation_date": document.getElementById('generationDate')?.value || new Date().toISOString().split('T')[0],
            "generation_time": timeNow,
            "period_id": document.getElementById('periodId')?.value || "5",
            "currency_id": "272",
            "trm": "0"
        },
        "notes": "",
        "employee": {
            "worker_type_id": parseInt(getVal('.workerTypeId', '1')),
            "worker_subtype_id": parseInt(getVal('.workerSubtypeId', '1')),
            "high_risk_pension": getVal('.highRiskPension', 'false'),
            "identity_document_id": getVal('.identityDocumentId', '1'),
            "document_number": getVal('.documentNumber'),
            "first_surname": getVal('.firstSurname'),
            "second_surname": getVal('.secondSurname'),
            "first_name": getVal('.firstName'),
            "other_names": getVal('.otherNames'),
            "working_country_id": getNumVal('.workingCountryId', 45),
            "work_city_id": getNumVal('.workCityId'),
            "work_address": getVal('.workAddress'),
            "integral_salary": getVal('.integralSalary', 'false'),
            "contract_type_id": parseInt(getVal('.contractTypeId', '1')),
            "salary": salary.toString(),
            "worker_code": getVal('.workerCode')
        },
        "payment": {
            "payment_method_id": getVal('.paymentMethodId', '1'),
            "means_payment_id": getVal('.meansPaymentId', '31'),
            "bank": getVal('.bank'),
            "account_type": getVal('.accountType'),
            "account_number": getVal('.accountNumber')
        },
        "earn": {
            "basic": {
                "worked_days": workedDays.toString(),
                "salary_worked": salaryWorked.toString()
            },
            "transport": {
                "transportation_assistance": transportationAssistance.toString(),
                "viatic_maintenance": getNumVal('.viaticMaintenance').toString(),
                "viatic_non_salary_maintenance": getNumVal('.viaticNonSalary').toString()
            },
            "HEDs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": hedAmount.toString(),
                    "percentage": hedPercentage.toFixed(2),
                    "payment": hedPayment.toFixed(2)
                }
            ],
            "HENs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": henAmount.toString(),
                    "percentage": henPercentage.toFixed(2),
                    "payment": henPayment.toFixed(2)
                }
            ],
            "HRNs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": hrnAmount.toString(),
                    "percentage": hrnPercentage.toFixed(2),
                    "payment": hrnPayment.toFixed(2)
                }
            ],
            "HEDDFs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": hedfAmount.toString(),
                    "percentage": hedfPercentage.toFixed(2),
                    "payment": hedfPayment.toFixed(2)
                }
            ],
            "HRDDFs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": hrdfAmount.toString(),
                    "percentage": hrdfPercentage.toFixed(2),
                    "payment": hrdfPayment.toFixed(2)
                }
            ],
            "HENDFs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": hendfAmount.toString(),
                    "percentage": hendfPercentage.toFixed(2),
                    "payment": hendfPayment.toFixed(2)
                }
            ],
            "HRNDFs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": hrndfAmount.toString(),
                    "percentage": hrndfPercentage.toFixed(2),
                    "payment": hrndfPayment.toFixed(2)
                }
            ],
            "vacations": {
                "common": {
                    "start_date": vacationTimeStartDate,
                    "final_date": vacationTimeEndDate,
                    "amount": vacationTimeDays.toString(),
                    "payment": vacationTimePayment.toFixed(2)
                },
                "paid": {
                    "amount": vacationPaidDays.toString(),
                    "payment": vacationPaidPayment.toFixed(2)
                }
            },
            "bonus": {
                "amount": "0",
                "payment": bonusPayment.toFixed(2),
                "non_salary_payment": primePayment.toFixed(2)
            },
            "cesantias": {
                "payment": cesantiasPayment.toFixed(2),
                "percentage": cesantiasPorcentage.toFixed(2),
                "interest_payment": cesantiasInterest.toFixed(2)
            },
            "incapacity": [
                {
                    "start_date": "2021-12-31",
                    "final_date": "2021-12-31",
                    "amount": "0",
                    "type_id": 1,
                    "payment": "0.00"
                }
            ],
            "licenses": {
                "licenseMP": {
                    "start_date": "2021-12-31",
                    "final_date": "2021-12-31",
                    "amount": "0",
                    "payment": "0.00"
                },
                "licenseR": {
                    "start_date": "2021-12-31",
                    "final_date": "2021-12-31",
                    "amount": "0",
                    "payment": "0.00"
                },
                "licenseNR": {
                    "start_date": "2021-12-31",
                    "final_date": "2021-12-31",
                    "amount": "0"
                }
            },
            "bonuses": [
                {
                    "bonusS": bonusPayment.toFixed(2),
                    "bonusNS": primePayment.toFixed(2)
                }
            ],
            "assistances": [
                {
                    "assistanceS": "0.00",
                    "assistanceNS": "0.00"
                }
            ],
            "legal_strikes": [
                {
                    "start_date": "2021-12-31",
                    "final_date": "2021-12-31",
                    "amount": "0"
                }
            ],
            "other_concepts": [
                {
                    "description": "Otros conceptos",
                    "conceptS": conceptS.toFixed(2),
                    "conceptNS": "0.00"
                }
            ],
            "compensations": [
                {
                    "compensationO": "0.00",
                    "compensationE": "0.00"
                }
            ],
            "bondEPCTVs": [
                {
                    "paymentS": "0.00",
                    "paymentNS": "0.00",
                    "payment_foodS": "0.00",
                    "payment_foodNS": "0.00"
                }
            ],
            "commissions": [
                {
                    "commission": commission.toFixed(2)
                }
            ],
            "payments_third_party": [
                {
                    "payment_third_party": "0.00"
                }
            ],
            "advances": [
                {
                    "advance": "0.00"
                }
            ],
            "endowment": "0.00",
            "sustaining_support": "0.00",
            "teleworking": "0.00",
            "withdrawal_bonus": "0.00",
            "indemnification": "0.00",
            "refund": "0.00"
        },
        "deductions": {
            "health": {
                "percentage": getNumVal('.healthPercentage', REGULACION.PORCENTAJE_SALUD).toString(),
                "deduction": healthDeduction.toString()
            },
            "pension_fund": {
                "percentage": getNumVal('.pensionPercentage', REGULACION.PORCENTAJE_PENSION).toString(),
                "deduction": pensionDeduction.toString()
            },
            "fundSP": {
                "percentage": "0.00",
                "deduction": "0.00",
                "percentageSub": "0.00",
                "deductionSub": "0.00"
            },
            "trade_union": [
                {
                    "percentage": "0.00",
                    "deduction": "0.00"
                }
            ],
            "sanctions": [
                {
                    "sanctionPublic": "0.00",
                    "sanctionPriv": "0.00"
                }
            ],
            "libranzas": [
                {
                    "description": "",
                    "deduction": "0.00"
                }
            ],
            "third_party_payment": [
                {
                    "third_party_pay": thirdPartyPay.toFixed(2)
                }
            ],
            "advances": [
                {
                    "advance": "0.00"
                }
            ],
            "other_deductions": [
                {
                    "other_deduction": otherDeduction.toFixed(2)
                }
            ],
            "voluntary_pension": "0.00",
            "retefuente": "0.00",
            "afc": "0.00",
            "cooperative": "0.00",
            "tax_embargo": "0.00",
            "complementary_plan": "0.00",
            "education": "0.00",
            "refund": "0.00",
            "debt": "0.00"
        },
        "rounding": Math.round(totalVoucher % 100).toString(),
        "total_earned": totalEarned.toString(),
        "deductions_total": totalDeductions.toString(),
        "total_voucher": totalVoucher.toString()
    };
}

// Función para actualizar la vista previa del JSON
function updatePreview() {
    const jsonData = generateEmployeeJSON();
    const previewElement = document.getElementById('jsonPreview');
    
    if (jsonData && previewElement) {
        previewElement.textContent = JSON.stringify(jsonData, null, 2);
    } else if (previewElement) {
        previewElement.textContent = 'Complete los datos del empleado para ver la vista previa...';
    }
}

// Función para generar y descargar el archivo JSON
function generateJSON() {
    const validation = validateRequiredFields();
    
    if (!validation.isValid) {
        alert(`Por favor complete los siguientes campos obligatorios:\n• ${validation.errors.join('\n• ')}`);
        return;
    }

    const jsonData = generateEmployeeJSON();
    
    if (!jsonData) {
        alert('❌ Error al generar el JSON. Verifique los datos ingresados.');
        return;
    }

    // Crear nombre de archivo
    const employeeName = jsonData.employee.first_name + '_' + jsonData.employee.first_surname;
    const filename = `nomina_${employeeName}_${jsonData.period.settlement_end_date}.json`;
    
    // Crear y descargar archivo JSON
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // También generar archivo TXT
    const txtBlob = new Blob([jsonString], { type: 'text/plain' });
    const txtUrl = URL.createObjectURL(txtBlob);
    const txtA = document.createElement('a');
    txtA.href = txtUrl;
    txtA.download = filename.replace('.json', '.txt');
    document.body.appendChild(txtA);
    txtA.click();
    document.body.removeChild(txtA);
    URL.revokeObjectURL(txtUrl);
    
    alert(`✅ Archivos generados exitosamente:\n\n📄 ${filename}\n📄 ${filename.replace('.json', '.txt')}\n\nLos archivos están listos para transmisión de nómina electrónica.`);
}

// Función para actualizar resumen
document.addEventListener('input', function(e) {
    if (e.target.matches('input[type="number"], input[type="text"]')) {
        setTimeout(updatePaymentSummary, 100);
    }
});

// Inicializar resumen al cargar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updatePaymentSummary, 500);
    
    // Listener para mostrar/ocultar campos de retiro
    const isRetirementCheckbox = document.getElementById('isRetirement');
    const retirementFields = document.getElementById('retirementFields');
    if (isRetirementCheckbox && retirementFields) {
        isRetirementCheckbox.addEventListener('change', function() {
            if (this.checked) {
                retirementFields.style.display = 'block';
            } else {
                retirementFields.style.display = 'none';
                // Limpiar los campos cuando se desmarca
                document.getElementById('departureDate').value = '';
            }
            // Recalcular totales cuando cambia el estado de retiro (para incluir/excluir cesantías)
            updatePaymentSummary();
        });
    }
    
    // Listener para mostrar/ocultar campos de vacaciones según el tipo seleccionado
    const vacationTypeSelect = document.getElementById('vacationType');
    const vacationTimeFields = document.getElementById('vacationTimeFields');
    const vacationPaidFields = document.getElementById('vacationPaidFields');
    
    if (vacationTypeSelect && vacationTimeFields && vacationPaidFields) {
        vacationTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            
            // Ocultar todos los campos primero
            vacationTimeFields.style.display = 'none';
            vacationPaidFields.style.display = 'none';
            
            // Mostrar campos según selección
            if (selectedType === 'time') {
                vacationTimeFields.style.display = 'block';
                // Limpiar campos de vacaciones pagadas
                document.querySelector('.vacationPaidDays').value = '0';
                document.querySelector('.vacationPaidPayment').value = '0';
            } else if (selectedType === 'paid') {
                vacationPaidFields.style.display = 'block';
                // Limpiar campos de vacaciones en tiempo
                document.querySelector('.vacationTimeDays').value = '0';
                document.querySelector('.vacationTimePayment').value = '0';
                document.querySelector('.vacationTimeStartDate').value = '';
                document.querySelector('.vacationTimeEndDate').value = '';
            } else if (selectedType === 'both') {
                vacationTimeFields.style.display = 'block';
                vacationPaidFields.style.display = 'block';
            } else { // none
                // Limpiar todos los campos de vacaciones
                document.querySelector('.vacationTimeDays').value = '0';
                document.querySelector('.vacationTimePayment').value = '0';
                document.querySelector('.vacationTimeStartDate').value = '';
                document.querySelector('.vacationTimeEndDate').value = '';
                document.querySelector('.vacationPaidDays').value = '0';
                document.querySelector('.vacationPaidPayment').value = '0';
            }
        });
    }
});




