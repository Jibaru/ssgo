let drawing = false;
let drawingMode = "line"; // Can be 'line' or 'rectangle'
let startX = 0;
let startY = 0;
let pastedImage = null; // Variable to hold the pasted image

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const img = new Image();
img.src = "/image";

img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
};

// Handle drawing mode toggle
function toggleDrawingMode() {
  drawingMode = drawingMode === "line" ? "rectangle" : "line";
  document.getElementById("modeButton").innerText = `Mode: ${
    drawingMode.charAt(0).toUpperCase() + drawingMode.slice(1)
  }`;
}

// Handle drawing start
function startDrawing(e) {
  drawing = true;
  const { x, y } = getCursorPosition(e);
  startX = x;
  startY = y;
  if (drawingMode === "line") {
    draw(e); // Start drawing immediately if in line mode
  }
}

// Handle drawing stop
function stopDrawing(e) {
  if (drawing && drawingMode === "rectangle") {
    const { x, y } = getCursorPosition(e);
    drawRectangle(startX, startY, x, y);
  }
  drawing = false;
  ctx.beginPath();
}

// Handle drawing on canvas
function draw(e) {
  if (!drawing) return;

  const { x, y } = getCursorPosition(e);

  if (drawingMode === "line") {
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "red";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  } else if (drawingMode === "rectangle") {
    // Redraw the canvas to show the rectangle while dragging
    redrawCanvas(); // Redraw all images and drawings
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    const width = x - startX;
    const height = y - startY;
    ctx.strokeRect(startX, startY, width, height);
  }
}

// Draw a rectangle
function drawRectangle(x1, y1, x2, y2) {
  redrawCanvas(); // Redraw all images and drawings
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1); // Draw the final rectangle
}

// Redraw the canvas with all images and drawings
function redrawCanvas() {
  ctx.drawImage(img, 0, 0); // Redraw the background image
  if (pastedImage) {
    ctx.drawImage(pastedImage, 0, 0); // Redraw the pasted image
  }
}

// Clear the canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  redrawCanvas(); // Redraw the image after clearing
}

// Download the edited image
function downloadImage() {
  const link = document.createElement("a");
  link.download = "edited_image.png";
  link.href = canvas.toDataURL();
  link.click();
}

// Copy the image to clipboard
function copyToClipboard() {
  canvas.toBlob((blob) => {
    const clipboardItem = new ClipboardItem({ "image/png": blob });
    navigator.clipboard.write([clipboardItem]).then(
      () => {
        alert("Image copied to clipboard");
      },
      (err) => {
        console.error("Error copying image to clipboard:", err);
      }
    );
  });
}

// Get cursor position relative to canvas
function getCursorPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return { x, y };
}

// Handle paste event to add image to canvas
document.addEventListener("paste", (e) => {
  if (e.clipboardData && e.clipboardData.items) {
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      if (e.clipboardData.items[i].type.startsWith("image/")) {
        const file = e.clipboardData.items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          pastedImage = new Image();
          pastedImage.onload = () => {
            redrawCanvas(); // Ensure the canvas is redrawn with the new image
          };
          pastedImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }
});

// Event listeners for mouse actions
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing); // Stops drawing when leaving the canvas
