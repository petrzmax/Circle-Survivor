// Utility functions

function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalize(vector) {
    const mag = Math.sqrt(vector.x ** 2 + vector.y ** 2);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: vector.x / mag, y: vector.y / mag };
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Spawn point outside screen
function getSpawnPoint(canvas, margin = 50) {
    const side = randomInt(0, 3);
    let x, y;
    
    switch (side) {
        case 0: // Top
            x = randomRange(0, canvas.width);
            y = -margin;
            break;
        case 1: // Right
            x = canvas.width + margin;
            y = randomRange(0, canvas.height);
            break;
        case 2: // Bottom
            x = randomRange(0, canvas.width);
            y = canvas.height + margin;
            break;
        case 3: // Left
            x = -margin;
            y = randomRange(0, canvas.height);
            break;
    }
    
    return { x, y };
}

// Collision detection
function circleCollision(a, b) {
    return distance(a, b) < a.radius + b.radius;
}

function rectCircleCollision(rect, circle) {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
    const distX = circle.x - closestX;
    const distY = circle.y - closestY;
    return (distX * distX + distY * distY) < (circle.radius * circle.radius);
}
