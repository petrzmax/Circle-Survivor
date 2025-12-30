export function renderBackground(ctx: CanvasRenderingContext2D): void {
  // Clear
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Grid pattern
  ctx.strokeStyle = '#1a2744';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < ctx.canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ctx.canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < ctx.canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ctx.canvas.width, y);
    ctx.stroke();
  }
}
