document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dataForm');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsDiv = document.getElementById('results');
    const statusDiv = document.getElementById('status');
    const templateFile = document.getElementById('templateFile');
    const uploadTemplateBtn = document.getElementById('uploadTemplateBtn');
    const templateStatus = document.getElementById('templateStatus');
    const dataSection = document.getElementById('dataSection');
    
    let currentTemplateId = null;
    
    // Загрузка шаблона
    uploadTemplateBtn.addEventListener('click', async function() {
        if (!templateFile.files[0]) {
            showTemplateStatus('Пожалуйста, выберите PDF файл', 'error');
            return;
        }
        
        try {
            showTemplateStatus('Загрузка шаблона...', 'info');
            
            const formData = new FormData();
            formData.append('file', templateFile.files[0]);
            
            const response = await fetch('/api/templates', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                currentTemplateId = result.templateId;
                
                showTemplateStatus(`✅ Шаблон загружен! Найдено ${result.manifest.fields.length} полей`, 'success');
                dataSection.style.display = 'block';
                
                // Показываем информацию о найденных полях
                console.log('Найденные поля:', result.manifest.fields);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка загрузки шаблона');
            }
        } catch (error) {
            console.error('Ошибка загрузки шаблона:', error);
            showTemplateStatus('Ошибка загрузки шаблона: ' + error.message, 'error');
        }
    });
    
    // Function to perform calculations
    function calculateValues(dailyConsumption) {
        const hourlyConsumption = 3.9 * dailyConsumption / 24;
        const secondlyConsumption = hourlyConsumption / 3.6;
        return {
            hourlyConsumption: hourlyConsumption.toFixed(2),
            secondlyConsumption: secondlyConsumption.toFixed(2)
        };
    }
    
    // Calculate button event handler
    calculateBtn.addEventListener('click', function() {
        const dailyConsumption = parseFloat(document.getElementById('dailyConsumption').value);
        
        if (isNaN(dailyConsumption)) {
            showStatus('Пожалуйста, введите корректное значение максимального суточного расхода воды', 'error');
            return;
        }
        
        const calculations = calculateValues(dailyConsumption);
        
        document.getElementById('hourlyConsumption').textContent = calculations.hourlyConsumption;
        document.getElementById('secondlyConsumption').textContent = calculations.secondlyConsumption;
        
        resultsDiv.style.display = 'block';
        showStatus('Расчеты выполнены успешно', 'success');
    });
    
    // Form submission event handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentTemplateId) {
            showStatus('Сначала загрузите PDF шаблон', 'error');
            return;
        }
        
        // Hide previous results
        resultsDiv.style.display = 'none';
        
        // Get form data and prepare values for API
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const daily = parseFloat(data.dailyConsumption);
        if (isNaN(daily)) {
            showStatus('Пожалуйста, введите корректное значение максимального суточного расхода воды', 'error');
            return;
        }
        // Compute values to show in UI if not calculated earlier
        const hourly = 3.9 * daily / 24;
        const secondly = hourly / 3.6;
        document.getElementById('hourlyConsumption').textContent = hourly.toFixed(2);
        document.getElementById('secondlyConsumption').textContent = secondly.toFixed(2);
        resultsDiv.style.display = 'block';

        // Собираем маппинг полей к меткам из формы
        const fieldMappings = {
            dailyConsumption: data.dailyConsumptionMarker || 'msr_daily',
            requiredHead: data.requiredHeadMarker || 'mchr',
            pumpModel: data.pumpModelMarker || 'n',
            flowMeter: data.flowMeterMarker || 'flow_meter',
            projectCode: data.projectCodeMarker || 'sh'
        };

        // Собираем маппинг полей к меткам из блока результатов
        const resultsMappings = {
            hourlyConsumption: document.getElementById('hourlyConsumptionMarker').value || 'mchr',
            secondlyConsumption: document.getElementById('secondlyConsumptionMarker').value || 'msr_secondly'
        };

        // Объединяем маппинги
        const allFieldMappings = {
            ...fieldMappings,
            ...resultsMappings
        };

        const requestData = {
            templateId: currentTemplateId,
            values: {
                // For server-side calculations and PDF filling
                dailyConsumption: daily,
                pump_model: data.pumpModel,
                project_code: data.projectCode,
                requiredHead: parseFloat(data.requiredHead),
                flow_meter: data.flowMeter
            },
            fieldMappings: allFieldMappings,
            options: {
                fontSize: 10,
                gap: 6,
                calculationOptions: { precision: 2 }
            }
        };
        
        try {
            showStatus('Генерация PDF...', 'info');
            
            // Send data to new API
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                // Create a blob from the response
                const blob = await response.blob();
                
                // Create a download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'completed_form.pdf';
                
                // Trigger download
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                showStatus('PDF успешно сгенерирован и загружен!', 'success');
            } else {
                // Try to get error message from server
                let errorMessage = 'Ошибка генерации PDF';
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // If response is not JSON, use default message
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('Произошла ошибка при генерации PDF: ' + error.message, 'error');
        }
    });
    
    // Function to show status messages
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
        statusDiv.style.display = 'block';
        
        // Hide status after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
    
    // Function to show template status messages
    function showTemplateStatus(message, type) {
        templateStatus.textContent = message;
        templateStatus.className = 'status ' + type;
        templateStatus.style.display = 'block';
        
        // Hide status after 5 seconds
        setTimeout(() => {
            templateStatus.style.display = 'none';
        }, 5000);
    }
});
