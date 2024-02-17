document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const saveBtn = document.getElementById('saveBtn');
    const saveCounter = document.getElementById('saveCounter');
    const totalSaveCounter = document.getElementById('totalSaveCounter');
    const colorOptions = document.querySelectorAll('.color-option');
    const resetBtn = document.getElementById('resetBtn');
    const sketchSubjects = ["Cat", "House", "Tree", "Car", "Mountain"];
    shuffleArray(sketchSubjects);
    let currentSubjectIndex = 0;
    let saveCount = 0;
    let totalSaveCount = 0;
    const gridSize = 32;
    let currentColor = '#000000'; // Default color
    let isDragging = false;

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

            cell.addEventListener('mousedown', () => isDragging = true);
            cell.addEventListener('mouseenter', handleCellEnter);
            cell.addEventListener('mouseup', () => isDragging = false);
            cell.addEventListener('click', handleCellClick);
        }
    }

    // Add event listeners for dragging
    document.body.addEventListener('mouseup', () => isDragging = false);
    // gridContainer.addEventListener('mouseleave', () => {
    //     isDragging = false;
    // });
    document.body.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('mousemove', (event) => {
        // Check if the left mouse button is not pressed
        if (event.buttons !== 1) {
            isDragging = false;
        }
    });

    // shuffle array using Knuth shuffle
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
        matrix[row][col] = [colorValue.r, colorValue.g, colorValue.b];
        cell.style.backgroundColor = currentColor;
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
        const sketchSubject = document.getElementById('sketchSubject');
        sketchSubject.textContent = sketchSubjects[currentSubjectIndex];
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
        saveMatrixAsImage();

        saveCount++;
        totalSaveCount++;
        if (saveCount >= 5) {
            saveCount = 0; // Reset counter
            currentSubjectIndex = (currentSubjectIndex + 1) % sketchSubjects.length; // Cycle through subjects
            updateSketchSubject(); // Update the subject
        }
        saveCounter.textContent = `${saveCount}/5`; // Update the counter display
        totalSaveCounter.textContent = `${totalSaveCount}/50 Submitted`; // Update the total counter display
        clearCanvas();

        if (totalSaveCount === 50) {
            createPopup(); // Display the popup
        }

        // Show and then hide the check mark
        const checkMark = document.getElementById('checkMark');
        checkMark.style.display = 'block'; // Make the check mark visible
        checkMark.style.opacity = 1; // Set opacity to 1 for full visibility

        setTimeout(() => {
            // Start fade out
            let fadeEffect = setInterval(() => {
                if (!checkMark.style.opacity) {
                    checkMark.style.opacity = 1;
                }
                if (checkMark.style.opacity > 0) {
                    checkMark.style.opacity -= 0.1;
                } else {
                    clearInterval(fadeEffect);
                    checkMark.style.display = 'none'; // Hide after fading
                }
            }, 100); // Adjust for smoother fade effect
        }, 2000); // Keep visible for 2000ms before starting to fade
    });


    // Function to save the matrix as an image
    async function saveMatrixAsImage() {
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
            const sketchSubject = sketchSubjects[currentSubjectIndex];
            const uniqueSequence = Date.now(); // Example of generating a unique sequence
            const fileName = `${sketchSubject}_${uniqueSequence}.png`;
    
            try {
                // Fetch the presigned URL from your server, including the dynamic filename in the request
                const response = await fetch('/generate-presigned-url', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ filename: fileName }) // Send filename to server
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
    }

    createGrid();

    
});
