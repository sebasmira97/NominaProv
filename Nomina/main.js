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

function setupCalculations(employeeDiv) {
    const salaryInput = employeeDiv.querySelector('.salary');
    const salaryWorkedInput = employeeDiv.querySelector('.salaryWorked');
    const healthPercentageInput = employeeDiv.querySelector('.healthPercentage');
    const healthDeductionInput = employeeDiv.querySelector('.healthDeduction');
    const pensionPercentageInput = employeeDiv.querySelector('.pensionPercentage');
    const pensionDeductionInput = employeeDiv.querySelector('.pensionDeduction');
    
    function calculateDeductions() {
        const salary = parseFloat(salaryInput.value) || 0;
        const healthPercentage = parseFloat(healthPercentageInput.value) || 4;
        const pensionPercentage = parseFloat(pensionPercentageInput.value) || 4;
        
        healthDeductionInput.value = Math.round(salary * healthPercentage / 100);
        pensionDeductionInput.value = Math.round(salary * pensionPercentage / 100);
    }

    // Calcular salario trabajado automáticamente
    function calculateSalaryWorked() {
        const salary = parseFloat(salaryInput.value) || 0;
        const workedDaysInput = employeeDiv.querySelector('.workedDays');
        const workedDays = parseFloat(workedDaysInput?.value) || 0;
        if (salary > 0 && workedDays > 0) {
            salaryWorkedInput.value = Math.round((salary / 30) * workedDays);
        } else {
            salaryWorkedInput.value = '';
        }
    }

    salaryInput.addEventListener('input', () => {
        calculateDeductions();
        calculateSalaryWorked();
    });
    healthPercentageInput.addEventListener('input', calculateDeductions);
    pensionPercentageInput.addEventListener('input', calculateDeductions);

    // También recalcular salario trabajado cuando cambian los días trabajados
    const workedDaysInput = employeeDiv.querySelector('.workedDays');
    if (workedDaysInput) {
        workedDaysInput.addEventListener('input', calculateSalaryWorked);
    }

    // Calcular inicialmente
    calculateDeductions();
    calculateSalaryWorked();
}

function generateEmployeeJSON(employeeDiv) {
    const getVal = (selector, defaultVal = '') => {
        const element = employeeDiv.querySelector(selector);
        return element ? element.value || defaultVal : defaultVal;
    };
    
    const getNumVal = (selector, defaultVal = 0) => {
        const val = getVal(selector);
        return val === '' ? defaultVal : parseFloat(val) || defaultVal;
    };

    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().split(' ')[0];
    };

    const timeNow = getCurrentTime();
    
    const salary = getNumVal('.salary');
    const workedDays = getNumVal('.workedDays', 30);
    const hedAmount = getNumVal('.hedAmount');
    const hedPercentage = getNumVal('.hedPercentage', 25);
    const transportationAssistance = getNumVal('.transportationAssistance');
    const bonusPayment = getNumVal('.bonusPayment');
    const commission = getNumVal('.commission');
    const conceptS = getNumVal('.conceptS');
    
    // Calcular total devengado
    const hedPayment = hedAmount > 0 ? Math.round((salary / 240) * (hedPercentage / 100) * hedAmount * salary / 1000) : 0;
    const totalEarned = salary + transportationAssistance + hedPayment + bonusPayment + commission + conceptS;
    
    const healthDeduction = Math.round(salary * getNumVal('.healthPercentage', 4) / 100);
    const pensionDeduction = Math.round(salary * getNumVal('.pensionPercentage', 4) / 100);
    const thirdPartyPay = getNumVal('.thirdPartyPay');
    const otherDeduction = getNumVal('.otherDeduction');
    
    const totalDeductions = healthDeduction + pensionDeduction + thirdPartyPay + otherDeduction;
    const totalVoucher = totalEarned - totalDeductions;
    
    return {
        "resolution_number": document.getElementById('resolutionNumber').value || "18760000001",
        "document_number": document.getElementById('documentNumber').value || "27",
        "generation_city_id": document.getElementById('generationCityId').value || "1",
        "worker_code": getVal('.workerCode'),
        "novelty": false,
        "pay_day": document.getElementById('payDay').value || new Date().toISOString().split('T')[0],
        "period": {
            "date_entry": document.getElementById('dateEntry').value || "",
            "departure_date": document.getElementById('departureDate').value || null,
            "settlement_start_date": document.getElementById('settlementStartDate').value || new Date().toISOString().split('T')[0],
            "settlement_end_date": document.getElementById('settlementEndDate').value || new Date().toISOString().split('T')[0],
            "time_worked": document.getElementById('timeWorked').value || "30",
            "generation_date": document.getElementById('generationDate').value || new Date().toISOString().split('T')[0]
        },
        "general_information": {
            "generation_date": document.getElementById('generationDate').value || new Date().toISOString().split('T')[0],
            "generation_time": timeNow,
            "period_id": document.getElementById('periodId').value || "5",
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
                "salary_worked": getNumVal('.salaryWorked', salary).toString()
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
                    "amount": "0",
                    "percentage": "0.00",
                    "payment": "0.00"
                }
            ],
            "HENs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": "0",
                    "percentage": "0.00",
                    "payment": "0.00"
                }
            ],
            "HRNs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": "0",
                    "percentage": "0.00",
                    "payment": "0.00"
                }
            ],
            "HEDDFs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": "0",
                    "percentage": "0.00",
                    "payment": "0.00"
                }
            ],
            "HRDDFs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": "0",
                    "percentage": "0.00",
                    "payment": "0.00"
                }
            ],
            "HENDFs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": "0",
                    "percentage": "0.00",
                    "payment": "0.00"
                }
            ],
            "HRNDFs": [
                {
                    "start_time": "2021-12-31T00:00:00",
                    "final_hour": "2021-12-31T00:00:00",
                    "amount": "0",
                    "percentage": "0.00",
                    "payment": "0.00"
                }
            ],
            "vacations": {
                "common": {
                    "start_date": "2021-12-31",
                    "final_date": "2021-12-31",
                    "amount": "0",
                    "payment": "0.00"
                },
                "paid": {
                    "amount": "0",
                    "payment": "0.00"
                }
            },
            "bonus": {
                "amount": "0",
                "payment": bonusPayment.toFixed(2),
                "non_salary_payment": "0.00"
            },
            "cesantias": {
                "payment": "0",
                "percentage": "0.00",
                "interest_payment": "0.00"
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
                    "bonusNS": "0.00"
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
                "percentage": getNumVal('.healthPercentage', 4).toString(),
                "deduction": healthDeduction.toString()
            },
            "pension_fund": {
                "percentage": getNumVal('.pensionPercentage', 4).toString(),
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

function updatePreview() {
    const employees = document.querySelectorAll('.employee-section');
    if (employees.length === 0) {
        document.getElementById('jsonPreview').textContent = 'Agregue al menos un empleado para ver la vista previa...';
        return;
    }
    
    const allEmployeesJSON = [];
    employees.forEach(emp => {
        allEmployeesJSON.push(generateEmployeeJSON(emp));
    });
    
    const preview = allEmployeesJSON.length === 1 ? 
        allEmployeesJSON[0] : 
        { "employees": allEmployeesJSON };
        
    document.getElementById('jsonPreview').textContent = JSON.stringify(preview, null, 2);
}

function generateJSON() {
    const employees = document.querySelectorAll('.employee-section');
    if (employees.length === 0) {
        alert('❌ Por favor agregue al menos un empleado antes de generar el JSON');
        return;
    }
    
    const allEmployeesJSON = [];
    employees.forEach(emp => {
        allEmployeesJSON.push(generateEmployeeJSON(emp));
    });
    
    let finalJSON;
    let filename;
    
    if (allEmployeesJSON.length === 1) {
        finalJSON = allEmployeesJSON[0];
        const employeeName = finalJSON.employee.first_name + '_' + finalJSON.employee.first_surname;
        filename = `nomina_${employeeName}_${finalJSON.period.settlement_end_date}.json`;
    } else {
        finalJSON = { "employees": allEmployeesJSON };
        filename = `nomina_multiple_${new Date().toISOString().split('T')[0]}.json`;
    }
    
    // Crear y descargar archivo
    const blob = new Blob([JSON.stringify(finalJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    // También generar archivo TXT
    const txtBlob = new Blob([JSON.stringify(finalJSON, null, 2)], { type: 'text/plain' });
    const txtUrl = URL.createObjectURL(txtBlob);
    const txtA = document.createElement('a');
    txtA.href = txtUrl;
    txtA.download = filename.replace('.json', '.txt');
    txtA.click();
    URL.revokeObjectURL(txtUrl);
    
    alert(`✅ Archivos generados exitosamente:\n\n📄 ${filename}\n📄 ${filename.replace('.json', '.txt')}\n\nLos archivos están listos para transmisión de nómina electrónica.`);
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
    
    // Agregar primer empleado
    addEmployee();
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

// Función para convertir input de ciudad de trabajo a select
async function convertWorkCityInputToSelect(apiUrl) {
    const workCityInput = document.getElementById('workCityId');
    if (!workCityInput) return;
    const workCitySelect = document.createElement('select');
    workCitySelect.id = 'workCityId';
    workCitySelect.className = workCityInput.className;
    workCitySelect.style.cssText = workCityInput.style.cssText;
    const currentValue = workCityInput.value;
    const cities = await loadCitiesFromAPI(apiUrl);
    if (cities.length > 0) {
        populateCitySelect(cities, workCitySelect);
        if (currentValue) {
            const matchingOption = Array.from(workCitySelect.options).find(
                option => option.value === currentValue
            );
            if (matchingOption) {
                workCitySelect.value = currentValue;
            }
        }
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