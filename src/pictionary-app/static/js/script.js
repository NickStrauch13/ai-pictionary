document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const saveBtn = document.getElementById('saveBtn');
    const colorOptions = document.querySelectorAll('.color-option');
    const resetBtn = document.getElementById('resetBtn');
    const sketchSubjects = ["Airplane", "Bicycle", "Butterfly", "Car", "Flower", "House", "Ladybug", "Train", "Tree", "Whale"];
    const toggleGraphBtn = document.getElementById('toggleGraphBtn');
    const graphContainer = document.getElementById('graphContainer');
    const flipCard = document.querySelector('.flip-card');
    const timerText = document.getElementById('timerText');
    shuffleArray(sketchSubjects);
    let currentSubjectIndex = 0;
    let saveCount = 0;
    let totalSaveCount = 0;
    const gridSize = 128;
    let currentColor = '#000000'; // Default color
    let isDragging = false;
    let brushSize = 3;
    let strokesMade = 0;
    let predictionFreq = 20; // Classify the image every 20 strokes
    let myChart = null;
    let timeRemaining = 20;
    let countdownInitiated = false;

    let matrix = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () =>
        [255, 255, 255])); // Initialize matrix with white color

    // Create the grid
    function createGrid() {
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            gridContainer.appendChild(cell);

            // Mouse events
            cell.addEventListener('mousedown', (event) => {
                event.preventDefault();
                event.stopPropagation();
                isDragging = true;
            });
            cell.addEventListener('mouseenter', handleCellEnter);
            cell.addEventListener('mouseup', () => isDragging = false);
            cell.addEventListener('click', handleCellClick);

            // Touch events
            cell.addEventListener('touchstart', handleTouchStart, { passive: false });
            cell.addEventListener('touchmove', handleTouchMove, { passive: false });
            cell.addEventListener('touchend', handleTouchEnd);
        }
    }

    // Add event listeners for dragging
    document.body.addEventListener('mouseup', () => isDragging = false);

    function handleTouchStart(event) {
        event.preventDefault(); // Prevent scrolling
        isDragging = true;
        const touch = event.touches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        if (targetElement && targetElement.classList.contains('cell')) {
            activateCell(targetElement);
        }
    }

    function handleTouchMove(event) {
        if (isDragging) {
            event.preventDefault(); // Prevent scrolling
            const touch = event.touches[0];
            const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
            if (targetElement && targetElement.classList.contains('cell')) {
                activateCell(targetElement);
            }
        }
    }

    function handleTouchEnd() {
        isDragging = false;
    }


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function handleCellEnter(e) {
        if (isDragging) {
            activateCell(e.target);
        }
    }

    function handleCellClick(e) {
        activateCell(e.target);
    }


    function activateCell(cell) {
        if (currentColor === null) {
            currentColor = '#000000';
        }
        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const colorValue = hexToRgb(currentColor);

        // Adjust this loop according to the current brushSize
        const offset = Math.floor(brushSize / 2); // Calculate offset for larger brush sizes
        for (let r = row - offset; r <= row + offset; r++) {
            for (let c = col - offset; c <= col + offset; c++) {
                updateCell(r, c, colorValue);
            }
        }
        strokesMade++;
        // If strokesMade is a multiple of predictionFreq, classify the image
        if (strokesMade % predictionFreq === 0)  {
            classifyImage();
        }
    }

    function updateCell(row, col, colorValue) {
        // Check boundaries
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
            matrix[row][col] = [colorValue.r, colorValue.g, colorValue.b];
            // Calculate cell index and directly update its style
            const cellIndex = row * gridSize + col;
            const cellToUpdate = gridContainer.querySelector(`[data-index="${cellIndex}"]`);
            if (cellToUpdate) {
                cellToUpdate.style.backgroundColor = `rgb(${colorValue.r}, ${colorValue.g}, ${colorValue.b})`;
            }
        }
    }

    // Set up color selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            currentColor = this.getAttribute('data-color');
            // Highlight selected color option, optional visual feedback
            colorOptions.forEach(opt => opt.style.outline = 'none');
            this.style.outline = '2px solid gold';
        });
    });

    // Convert HEX color to RGB
    function hexToRgb(hex) {
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
    
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function updateSketchSubject() {
        const promptText = document.getElementById('promptText');
        promptText.textContent = sketchSubjects[currentSubjectIndex];
    }
    updateSketchSubject();

    function createPopup() {
        const popup = document.createElement('div');
        popup.id = 'popup';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = '#f8f9fa'; // Light background color for contrast
        popup.style.padding = '20px';
        popup.style.zIndex = '1000';
        popup.style.border = '2px solid #302e52'; // Main color theme for border
        popup.style.borderRadius = '10px'; // Rounded corners
        popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // More pronounced shadow for depth
        popup.innerHTML = `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
                <button id="closePopup" style="background-color: #302e52; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">X</button>
            </div>
            <p style="color: #333; font-size: 20px; font-weight: bold; line-height: 1.5;">Thank you for helping me collect data! I really appreciate your time. If you want to continue drawing, you can close this window and continue.</p>
        `;
        document.body.appendChild(popup);
    
        document.getElementById('closePopup').addEventListener('click', function() {
            popup.style.display = 'none';
        });
    }


    saveBtn.addEventListener('click', () => {
        // Convert the matrix as an image, save to S3 bucket
        //saveMatrixAsImage(currentSubjectIndex);
        classifyImage();

        saveCount++;
        totalSaveCount++;
        if (saveCount >= 5) {
            saveCount = 0; // Reset counter
            currentSubjectIndex = (currentSubjectIndex + 1) % sketchSubjects.length; // Cycle through subjects
            updateSketchSubject(); // Update the subject
        }
        clearCanvas();

        if (totalSaveCount === 50) {
            createPopup(); // Display the popup
        }

    });


    // Function to save the matrix as an image
    async function saveMatrixAsImage(immediateSubjectIndex) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = gridSize;
        canvas.height = gridSize;
    
        // Draw the matrix onto the canvas
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const [r, g, b] = matrix[row][col];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(col, row, 1, 1);
            }
        }
    
        canvas.toBlob(async (blob) => {
            // Get the current sketch subject and generate a unique filename
            const sketchSubject = sketchSubjects[immediateSubjectIndex];
            const uniqueSequence = Date.now(); 
            const fileName = `${sketchSubject}_${uniqueSequence}.png`;
    
            try {
                // Fetch the presigned URL from your server, including the dynamic filename in the request
                const response = await fetch('/generate-presigned-url', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ filename: fileName,
                                           sketchsubject: sketchSubject})
                });
                const data = await response.json();
    
                // Use the presigned URL to upload the image
                const uploadResponse = await fetch(data.url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'image/png'
                    },
                    body: blob
                });
    
                if (uploadResponse.ok) {
                    console.log('Upload successful');
                } else {
                    console.log(uploadResponse)
                    console.error('Upload failed');
                }
            } catch (error) {
                console.error('Error generating presigned URL or uploading:', error);
            }
        }, 'image/png');
    }


    resetBtn.addEventListener('click', clearCanvas);

    function clearCanvas() {
        const cells = document.querySelectorAll('.cell');
        // Clear the matrix
        matrix = Array.from({ length: gridSize }, () =>
            Array.from({ length: gridSize }, () =>
                [255, 255, 255])); // Reset to white or your default grid color
        // Reset the visual grid
        cells.forEach(cell => {
            cell.style.backgroundColor = '#f0f0f0'; // Reset cells to white
        });
        strokesMade = 0;
    }

    createGrid();

    // Timer
    function startCountdown() {
        const interval = setInterval(() => {
            timeRemaining -= 1;
            if (timeRemaining < 10) {
                timerText.textContent = `00:0${timeRemaining}`;
            } else {
                timerText.textContent = `00:${timeRemaining}`;
            }
    
            if (timeRemaining <= 0) {
                clearInterval(interval);
            }
        }, 1000); // Decrease every 1 second
    }

    // Flip the prompt card
    flipCard.addEventListener('click', () => {
        const flipInner = flipCard.querySelector('.flip-card-inner');
        flipInner.style.transform = flipInner.style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
        if (!countdownInitiated){
            countdownInitiated = true;
            startCountdown();
        }
    });

    // Function to create or update the prediction chart
    function updateChart(newData) {
        const predictions = Object.entries(newData).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const labels = predictions.map(([label, _]) => label);
        const scores = predictions.map(([_, score]) => score);
    
        const ctx = document.getElementById('predictionGraph').getContext('2d');
    
        if (!myChart) {
            // Create the chart if it doesn't exist
            myChart = new Chart(ctx, {
                type: 'bar', // 'horizontalBar' for older versions of Chart.js
                data: {
                    labels: labels,
                    datasets: [{
                        label: "",
                        data: scores,
                        backgroundColor: 'rgba(74, 224, 74, 0.5)',
                        borderColor: 'rgba(74, 224, 74, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        legend: {
                            display: false 
                        }
                    },
                    indexAxis: 'y', 
                    scales: {
                        y: { 
                            ticks: {
                                autoSkip: false
                            }
                        },
                        x: { 
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            // Update the chart if it already exists
            myChart.data.labels = labels;
            myChart.data.datasets.forEach((dataset) => {
                dataset.data = scores;
            });
            myChart.update();
        }
    }

    
    updateChart({"Airplane":0, "Bicycle":0, "Butterfly":0, "Car":0, "Flower":0}); // Initialize the chart with zero confidence values
    graphContainer.style.display = 'none';

    toggleGraphBtn.addEventListener('click', () => {
        if (graphContainer.style.display === 'none') {
            graphContainer.style.display = 'block';
            toggleGraphBtn.textContent = 'Hide Graph';
        } else {
            graphContainer.style.display = 'none';
            toggleGraphBtn.textContent = 'Show Graph';
        }
    });


    // Send image to /predict enpoint
    async function predictAndDisplayResults(imageData) {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageData,
                sketchsubject: sketchSubjects[currentSubjectIndex]  // Assuming you want to send this as well
            })
        });
        const data = await response.json();
        const topPredictionElement = document.getElementById('topPrediction');
        const topPredictionClassElement = document.getElementById('topPredictionClass');
        const correctPredictionElement = document.getElementById('correctPredictionClass');

        // Update the prediction text
        if (strokesMade >= 50 && data.all_predictions[data.predicted_class] > 0.7) {
            if (data.predicted_class === sketchSubjects[currentSubjectIndex]) {
                topPredictionElement.textContent = `Oh, I got it! It's`;
                correctPredictionElement.textContent = `${data.predicted_class}`;
                topPredictionClassElement.textContent = `🎉🎉🎉`;
            } else {
                topPredictionElement.textContent = `Is it`;
                correctPredictionElement.textContent = ``;
                topPredictionClassElement.textContent = `${data.predicted_class}?`;
            }
        } else {
            topPredictionElement.textContent = `Hmmm... I'm not sure.`;
            correctPredictionElement.textContent = ``;
            topPredictionClassElement.textContent = ``;
        }
        
        console.log('Prediction result:', data);

        updateChart(data.all_predictions);
    }


    // Function to classify the image and display results
    async function classifyImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = gridSize;
        canvas.height = gridSize;
    
        // Draw the matrix onto the canvas
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const [r, g, b] = matrix[row][col];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(col, row, 1, 1);
            }
        }
    
        // Convert the canvas to a Base64-encoded image
        const imageData = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');
    
        // Send this image data to your Flask `/predict` endpoint
        try {
            await predictAndDisplayResults(imageData);      
        } catch (error) {
            console.error('Error in sending the image for classification:', error);
        }
    }
    
    
});
