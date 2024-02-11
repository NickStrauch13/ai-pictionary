// script.js
document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const saveBtn = document.getElementById('saveBtn');
    const gridSize = 32;
    let matrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    // Function to create the grid
    function createGrid() {
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseenter', handleMouseEnter);
            cell.dataset.index = i;
            gridContainer.appendChild(cell);
        }
    }

    let isDragging = false;
    document.body.addEventListener('mousedown', () => isDragging = true);
    document.body.addEventListener('mouseup', () => isDragging = false);

    // Function to handle cell activation
    function activateCell(cell) {
        const index = cell.dataset.index;
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        matrix[row][col] = 1;
        cell.style.backgroundColor = 'black';
    }

    // Mouse down event
    function handleMouseDown(e) {
        if (e.target.classList.contains('cell')) {
            activateCell(e.target);
        }
    }

    // Mouse enter event for drag functionality
    function handleMouseEnter(e) {
        if (isDragging && e.target.classList.contains('cell')) {
            activateCell(e.target);
        }
    }

    createGrid();

    // Function to save the matrix as an image
    function saveMatrixAsImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = gridSize;
        canvas.height = gridSize;

        // Draw the matrix on the canvas
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                ctx.fillStyle = matrix[row][col] === 1 ? 'black' : 'white';
                ctx.fillRect(col, row, 1, 1); // Draw each cell
            }
        }

        // Trigger download of the canvas as an image
        const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        const link = document.createElement('a');
        link.download = 'matrix-image.png';
        link.href = image;
        link.click();
    }

    saveBtn.addEventListener('click', saveMatrixAsImage);
});
