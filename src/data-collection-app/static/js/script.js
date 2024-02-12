document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const saveBtn = document.getElementById('saveBtn');
    const saveCounter = document.getElementById('saveCounter');
    const totalSaveCounter = document.getElementById('totalSaveCounter');
    const colorOptions = document.querySelectorAll('.color-option');
    const resetBtn = document.getElementById('resetBtn');
    const sketchSubjects = ["Cat", "House", "Tree", "Car", "Mountain"];
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

    document.body.addEventListener('mouseup', () => isDragging = false);

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


    saveBtn.addEventListener('click', () => {
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
    function saveMatrixAsImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = gridSize;
        canvas.height = gridSize;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const [r, g, b] = matrix[row][col];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(col, row, 1, 1);
            }
        }

        const link = document.createElement('a');
        link.download = 'grid-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    saveBtn.addEventListener('click', saveMatrixAsImage);

        
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
