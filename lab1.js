const canvas = document.getElementById('graph');
const ctx = canvas.getContext('2d');
const form = document.getElementById('point-form');
const checkboxes = document.querySelectorAll('input[name="r"]');
const clearButton = document.getElementById('clear');

const STORAGE_KEY = 'points22721';
const ALLOWED_R = [1, 1.5, 2, 2.5, 3];

function loadPoints() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || '[]'
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(function (point) {
            return point &&
                Number.isFinite(point.x) &&
                point.x >= -3 &&
                point.x <= 5 &&
                Number.isFinite(point.y) &&
                point.y >= -3 &&
                point.y <= 3 &&
                ALLOWED_R.includes(point.r) &&
                typeof point.hit === 'boolean' &&
                typeof point.time === 'string';
        });
    } catch {
        return [];
    }
}

function savePoints() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(points)
        );
    } catch {
        console.error('Не удалось сохранить результаты');
    }
}

let points = loadPoints();
let currentPoint = points.length > 0 ? points[0] : null;

function getR() {
    for (const checkbox of checkboxes) {
        if (checkbox.checked) {
            return Number(checkbox.value);
        }
    }

    return null;
}

function draw(point) {

    const r = getR() || (point ? point.r : 1);
    const center = canvas.width / 2;
    const scale = 40;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();
    ctx.translate(center, center);

    ctx.fillStyle = '#4a90e2';


    ctx.fillRect(
        0,
        -r * scale,
        r * scale,
        r * scale
    );

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(
        0,
        0,
        r * scale / 2,
        Math.PI / 2,
        Math.PI
    );
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * scale, 0);
    ctx.lineTo(0, r * scale);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#222';
    ctx.beginPath();

    ctx.moveTo(-220, 0);
    ctx.lineTo(220, 0);

    ctx.moveTo(0, -220);
    ctx.lineTo(0, 220);

    ctx.moveTo(220, 0);
    ctx.lineTo(210, -5);

    ctx.moveTo(220, 0);
    ctx.lineTo(210, 5);


    ctx.moveTo(0, -220);
    ctx.lineTo(-5, -210);

    ctx.moveTo(0, -220);
    ctx.lineTo(5, -210);

    ctx.stroke();

    ctx.font = '14px Arial';
    ctx.fillStyle = '#222';

    ctx.fillText('X', 225, 15);
    ctx.fillText('Y', 8, -225);

    const marks = [
        -r,
        -r / 2,
        r / 2,
        r
    ];

    for (const value of marks) {
        const x = value * scale;
        const y = -value * scale;

        ctx.beginPath();

        ctx.moveTo(x, -4);
        ctx.lineTo(x, 4);

        ctx.moveTo(-4, y);
        ctx.lineTo(4, y);

        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillText(
            String(value),
            x,
            18
        );

        ctx.textAlign = 'left';
        ctx.fillText(
            String(value),
            8,
            y + 5
        );
    }

    if (point) {
        ctx.beginPath();

        ctx.arc(
            point.x * scale,
            -point.y * scale,
            6,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            point.hit ? 'green' : 'red';

        ctx.fill();
    }

    ctx.restore();
}

function validate(input, min, max, errorId) {
    const text = input.value
        .trim()
        .replace(',', '.');

    const decimalFormat = /^-?\d+(\.\d+)?$/;

    let value = null;
    let error = '';

    if (!decimalFormat.test(text)) {
        error = 'Введите обычное число';
    } else {
        value = Number(text);

        if (value < min || value > max) {
            error = `Допустимо от ${min} до ${max}`;
        }
    }

    document
        .getElementById(errorId)
        .textContent = error;

    input.setAttribute(
        'aria-invalid',
        error !== ''
    );

    return error ? null : value;
}

function checkHit(x, y, r) {
    const rectangle =
        x >= 0 &&
        x <= r &&
        y >= 0 &&
        y <= r;

    const circle =
        x <= 0 &&
        y <= 0 &&
        x * x + y * y <= r * r / 4;

    const triangle =
        x >= 0 &&
        y <= 0 &&
        y >= x - r;

    return rectangle || circle || triangle;
}

function showHistory() {
    const table = document.getElementById('results');
    table.innerHTML = '';

    for (const point of points) {
        const row = table.insertRow();

        row.insertCell().textContent = point.x;
        row.insertCell().textContent = point.y;
        row.insertCell().textContent = point.r;

        const result = row.insertCell();

        result.textContent =
            point.hit ? 'Попадание' : 'Промах';

        result.className =
            point.hit ? 'hit' : 'miss';

        row.insertCell().textContent =
            new Date(point.time)
                .toLocaleString('ru-RU');
    }
}


checkboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
        if (this.checked) {
            checkboxes.forEach(item => {
                if (item !== this) {
                    item.checked = false;
                }
            });
        } else if (!getR()) {
            this.checked = true;
            return;
        }


        draw(currentPoint);
    });
});

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const x = validate(
        document.getElementById('x'),
        -3,
        5,
        'x-error'
    );

    const y = validate(
        document.getElementById('y'),
        -3,
        3,
        'y-error'
    );

    const r = getR();
    const rError =
        document.getElementById('r-error');

    const validR = ALLOWED_R.includes(r);

    rError.textContent =
        validR
            ? ''
            : 'Выберите допустимое R';

    if (
        x === null ||
        y === null ||
        !validR
    ) {
        return;
    }

    currentPoint = {
        x: x,
        y: y,
        r: r,
        hit: checkHit(x, y, r),
        time: new Date().toISOString()
    };

    points.unshift(currentPoint);

    savePoints();
    showHistory();
    draw(currentPoint);
});

clearButton.addEventListener('click', function () {
    points = [];
    currentPoint = null;

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        console.error('Не удалось очистить результаты');
    }

    showHistory();
    draw(null);
});


if (currentPoint) {
    checkboxes.forEach(function (checkbox) {
        checkbox.checked =
            Number(checkbox.value) === currentPoint.r;
    });
}

showHistory();
draw(currentPoint);