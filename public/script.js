document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dataForm');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsDiv = document.getElementById('results');
    const statusDiv = document.getElementById('status');
    
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
        
        // Hide previous results
        resultsDiv.style.display = 'none';
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            showStatus('Генерация PDF...', 'success');
            
            // Send data to server
            const response = await fetch('/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
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
});