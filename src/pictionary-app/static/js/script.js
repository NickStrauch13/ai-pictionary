document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const colorOptions = document.querySelectorAll('.color-option');
    const resetBtn = document.getElementById('resetBtn');
    const sketchSubjects = ["Airplane", "Bicycle", "Butterfly", "Car", "Flower", "House", "Ladybug", "Train", "Tree", "Whale"];
    const toggleGraphBtn = document.getElementById('toggleGraphBtn');
    const graphContainer = document.getElementById('graphContainer');
    graphContainer.style.display = 'none';
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
    let predThreshold = 0.70; 
    let predictionFreq = 20; // Classify the image every 20 strokes
    let minStrokesForThink = 50; // Minimum strokes before showing thinking message
    let minStrokesForPred = 100; // Minimum strokes before showing prediction
    let drawingEnabled = false;
    let popupShown = false;
    let myChart = null;
    let timeRemaining = 20;
    let countdownInitiated = false;
    let currentScore = 0;
    let totalScore = 0;
    let drawingsCompleted = 0;
    let drawingsNeeded = 4;
    let imageSaveNames = [];

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
        if (drawingEnabled) {
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


    async function createPopup() {
        // Create the popup element
        const popup = document.createElement('div');
        popup.id = 'popup';
        popup.className = "popup";

        // Create score element
        const scoreText = document.createElement('p');
        scoreText.className = "popup-score";
        currentScore = timeRemaining * 10;
        scoreText.textContent = `Score: ${currentScore}`;

        // Message, Score, and Close Button
        const message = document.createElement('p');
        message.className = "popup-message"
        popup.appendChild(message);
        popup.appendChild(scoreText);
        const closeButton = document.createElement('button');
        if (timeRemaining > 0) {
            message.textContent = "Correct! Well done.";
            closeButton.className = "popup-close-button";
        } else {
            message.textContent = "Oops! You were too slow.";
            closeButton.className = "popup-fail-close-button";
        }
        closeButton.textContent = 'Next';
        closeButton.addEventListener('click', handleNextSubject);
        popup.appendChild(closeButton);
    
        document.body.appendChild(popup);  

        const response = await saveMatrixAsImage(currentSubjectIndex);
        imageSaveNames.push(response.filename);

        return popup;
    }
    

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
    
        // Get the data URL from the canvas
        var dataUrl = canvas.toDataURL('image/png');
    
        // Extract the data part of the URL
        const data = dataUrl.replace(/^data:image\/png;base64,/, '');
    
        // Send the image data to the Flask server
        try {
            const response = await fetch('/save_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_data: data,
                    sketch_subject: sketchSubjects[immediateSubjectIndex]
                })
            });
            const responseData = await response.json(); // Assuming the server responds with JSON
            return responseData; // Return the response data from the function
        } catch (error) {
            console.error('Error saving the image:', error);
            throw error; // Rethrow or handle error appropriately
        }
    }    

    resetBtn.addEventListener('click', clearCanvas);

    function clearCanvas() {
        const cells = document.querySelectorAll('.cell');
        // Clear the matrix
        matrix = Array.from({ length: gridSize }, () =>
            Array.from({ length: gridSize }, () =>
                [255, 255, 255])); // Reset to default grid color
        // Reset the visual grid
        cells.forEach(cell => {
            cell.style.backgroundColor = '#f0f0f0'; // Reset cells to white
        });
        strokesMade = 0;
        classifyImage();
        setTimeout(() => {
            updateChart({"Airplane":0, "Bicycle":0, "Butterfly":0, "Car":0, "Flower":0});
        }, 250);
    }

    createGrid();

    // Timer
    function toggleTimer() {
        // If a timer is already running, stop it
        if (window.countdownInterval) {
            clearInterval(window.countdownInterval);
            window.countdownInterval = null;
            timerText.textContent = `00:${timeRemaining}`;
        } else {
            // Start a new timer if none is running
            window.countdownInterval = setInterval(() => {
                timeRemaining -= 1;
                if (timeRemaining < 10) {
                    timerText.textContent = `00:0${timeRemaining}`;
                } else{
                    timerText.textContent = `00:${timeRemaining}`;
                }
        
                if (timeRemaining <= 0) {
                    clearInterval(window.countdownInterval);
                    window.countdownInterval = null;
                    countdownInitiated = false;
                    currentScore = timeRemaining * 10;
                    totalScore += currentScore;
                    popupShown = true;
                    drawingEnabled = false;
                    drawingsCompleted++;
                    // Add time out logic
                    if (drawingsCompleted < drawingsNeeded) {
                        createPopup();
                    } else {
                        finishGame();
                    }
                }
            }, 1000);
        }
    }

    // Flip the prompt card 
    flipCard.addEventListener('click', () => {
        const flipInner = flipCard.querySelector('.flip-card-inner');
        flipInner.style.transform = flipInner.style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
        if (!countdownInitiated){
            countdownInitiated = true;
            toggleTimer();
        }
        if (!drawingEnabled && !popupShown) {
            drawingEnabled = true;
        }
    });

    // Function to create or update the prediction chart
    function updateChart(newData) {
        const predictions = Object.entries(newData).sort((a, b) => b[1] - a[1]).slice(0, 5);
        // If strokesMade is less than minStrokesForPred, Scale each prediction down
        if (strokesMade < minStrokesForPred) {
            predictions.forEach((prediction) => {
                prediction[1] = prediction[1] * (strokesMade / minStrokesForPred);
            });
        }
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
                            beginAtZero: true,
                            suggestedMax: 1,
                            max: 1
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
            toggleGraphBtn.textContent = 'Hide Insights';
        } else {
            graphContainer.style.display = 'none';
            toggleGraphBtn.textContent = 'View Insights';
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
                sketchsubject: sketchSubjects[currentSubjectIndex] 
            })
        });
        const data = await response.json();
        const topPredictionElement = document.getElementById('topPrediction');
        const topPredictionClassElement = document.getElementById('topPredictionClass');
        const correctPredictionElement = document.getElementById('correctPredictionClass');

        // Update the prediction text
        if (strokesMade >= minStrokesForPred && data.all_predictions[data.predicted_class] > predThreshold) {
            if (data.predicted_class === sketchSubjects[currentSubjectIndex]) {
                topPredictionElement.textContent = `Oh, I got it! It's`;
                correctPredictionElement.textContent = `${data.predicted_class}`;
                topPredictionClassElement.textContent = `🎉🎉🎉`;
                showCorrectPredictionPopup();
            } else {
                topPredictionElement.textContent = `Is it`;
                correctPredictionElement.textContent = ``;
                topPredictionClassElement.textContent = `${data.predicted_class}?`;
            }
        } else if (strokesMade >= minStrokesForThink && strokesMade < minStrokesForPred) {
            topPredictionElement.textContent = `Let me think...`;
            correctPredictionElement.textContent = ``;
            topPredictionClassElement.textContent = ``;
        } else {
            topPredictionElement.textContent = `Hmmm... I'm not sure.`;
            correctPredictionElement.textContent = ``;
            topPredictionClassElement.textContent = ``;
        }
        
        //console.log('Prediction result:', data);

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
    
        // Send this image data to Flask `/predict` endpoint
        try {
            await predictAndDisplayResults(imageData);      
        } catch (error) {
            console.error('Error in sending the image for classification:', error);
        }
    }
    

    function showCorrectPredictionPopup() {
        drawingsCompleted++;
        if (drawingsCompleted < drawingsNeeded) {
            createPopup();
        } else {
            finishGame();
        }
        toggleTimer();
        countdownInitiated = false;
        totalScore += currentScore;
        popupShown = true;
        drawingEnabled = false;
    }


    function handleNextSubject() {
        currentSubjectIndex = (currentSubjectIndex + 1) % sketchSubjects.length;
        clearCanvas();
        resetTimer();
        flipCard.click(); 
        toggleTimer();
        countdownInitiated = false;
        // Remove all popup elements
        document.getElementById('popup').remove(); 
        popupShown = false;
        //sleep for .5 seconds before advancing
        setTimeout(() => {
            updateSketchSubject();
        }, 500);
    }

    function resetTimer() {
        timeRemaining = 20; 
        timerText.textContent = `00:${timeRemaining}`;
    }

    async function finishGame() {
        // Save the last image
        const response = await saveMatrixAsImage(currentSubjectIndex);
        imageSaveNames.push(response.filename);

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        // Add title, final score, and instructions
        const overlayTextContainer = document.createElement('div');
        overlayTextContainer.className = 'overlay-text-container';
        overlay.appendChild(overlayTextContainer);
        const overlayTitle = document.createElement('h1');
        overlayTitle.className = 'overlay-title';
        overlayTitle.textContent = 'Game Over!';
        overlayTextContainer.appendChild(overlayTitle);
        const overlayScore = document.createElement('p');
        overlayScore.className = 'overlay-score';
        overlayScore.textContent = `Final Score: ${totalScore}`;
        overlayTextContainer.appendChild(overlayScore);
        const overlayInstructions = document.createElement('p');
        overlayInstructions.className = 'overlay-instructions';
        overlayInstructions.textContent = '(Click on an image to see model insights)';
        overlayTextContainer.appendChild(overlayInstructions);

        // Create content div
        const content = document.createElement('div');
        content.className = 'overlay-content';

        // Setting up a container div for images
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'final-images-container';

        // Array of image names 
        imageSaveNames.forEach(name => {
            const img = document.createElement('img');
            const imgSubContainer = document.createElement('div');
            imgSubContainer.className = 'final-image-sub-container';
            img.className = 'final-image';
            img.src = `./static/images/${name}`;
            img.id = `./static/images/${name}`;

            img.addEventListener('click', () => {
                fetchInsight(img.id);
            });

            imgSubContainer.appendChild(img);
            imagesContainer.appendChild(imgSubContainer);
        });

        // Append imagesContainer to content
        content.appendChild(imagesContainer);

        // Append content to overlay
        overlay.appendChild(content);
        
        //Close
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) { // Close only if the overlay background is clicked
                document.body.removeChild(overlay);
            }
        });

        // Append overlay to body
        document.body.appendChild(overlay);
    }

    async function fetchInsight(imagePath) {
        const response = await fetch('/create_important_pixel_plots', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_path: imagePath,
                sketch_subject: sketchSubjects[currentSubjectIndex],
                num_plots: 20
            })
        });
        const data = await response.json();
        const filepaths = data.filenames;
        
    }

});
