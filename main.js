function HSL(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
}

function WorkerInstructions(startX, startY, leftEdge, bottomEdge, realRange, imaginaryRange,
                            pixelsWidth, pixelsHeight) {
    this.returnColor = false;
    this.maxSteps = maxSteps;
    this.maxDistSquared = distLimitSquared;
    this.startX = startX;
    this.startY = startY;
    this.leftEdge = leftEdge;
    this.bottomEdge = bottomEdge;
    this.rangeR = realRange;
    this.rangeI = imaginaryRange;
    this.pxW = pixelsWidth;
    this.pxH = pixelsHeight;
}

// Spiral selector, ported from Python
// Credit: https://stackoverflow.com/a/398302
function spiral(spiralW, spiralH) {
    let [x, y, dx, dy] = [0, 0, 0, -1];
    let max = Math.max(spiralW, spiralH) ** 2;
    let [halfSpiralX, halfSpiralY] = [spiralW / 2, spiralH / 2];

    let pointArray = [];
    for (let i = 0; i < max; ++i) {
        // if ((-halfSpiralX < x <= halfSpiralX) && (-halfSpiralY < y <= halfSpiralY)) {
        if ((-spiralW / 2 < x && x <= spiralW / 2) && (-spiralH / 2 < y && y <= spiralH / 2)) {
            let startX = (x + halfSpiralX - 1) * drawWidth;
            let startY = (y + halfSpiralY - 1) * drawHeight;
            let width = startX + drawWidth > globalElem.width && drawWidthDiff > 0 ? drawWidthDiff : drawWidth;
            let height = startY + drawHeight > globalElem.height && drawHeightDiff > 0 ? drawHeightDiff : drawHeight;

            pointArray.push({
                x: startX, y: startY, pxW: width, pxH: height,
                l: (startX / globalElem.width) * realRange + leftEdge,
                b: (startY / globalElem.height) * imaginaryRange + bottomEdge,
                rR: (width / globalElem.width) * realRange,
                rI: (height / globalElem.height) * imaginaryRange
            });
        }
        if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) [dx, dy] = [-dy, dx];
        [x, y] = [x + dx, y + dy];
    }
    return pointArray;
}

// Credit: https://stackoverflow.com/a/9493060
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
}

// Takes color as HSL, returns it as RGB
function getColor(number, maxNumber, colorPalette) {
    if (number === maxNumber) {
        return colorPalette[colorPalette.length - 1];
    } else if (number > maxNumber || number < 0) {
        // return new HSL(0, 0, 0);
        // Fluro pink, to make errors obvious
        return new HSL(322, 96, 47);
    }

    const normalized = number / maxNumber;
    const mapped = normalized * (colorPalette.length - 1);

    const colorOne = colorPalette[Math.floor(mapped)];
    const colorTwo = colorPalette[Math.floor(mapped) + 1];

    if (colorOne === undefined || colorTwo === undefined) {
        console.log(number);
    }

    const finalH = (colorOne.h - colorTwo.h) * (1 - mapped % 1) + colorTwo.h;
    const finalS = (colorOne.s - colorTwo.s) * (1 - mapped % 1) + colorTwo.s;
    const finalV = (colorOne.l - colorTwo.l) * (1 - mapped % 1) + colorTwo.l;

    return new HSL(finalH, finalS, finalV);
}

// const log2 = Math.log(2);

/*
function findEscapeForValue(startR, startI, maxSteps, maxDist) {
    let curRS = startR * startR;
    let curIS = startI * startI;
    let curI = 2 * startR * startI + startI;
    let curR = curRS - curIS + startR;

    let stepsLeft = maxSteps;
    while (curRS + curIS <= maxDist && --stepsLeft) {
        curRS = curR * curR;
        curIS = curI * curI;
        curI = 2 * curR * curI + startI;
        curR = curRS - curIS + startR;
    }

    if (stepsLeft === 0) return [maxSteps, false];


    let step = maxSteps - stepsLeft;

    // return step;

    if (step === maxSteps) return step;

    let mu = step + 1 - Math.log(Math.log(Math.sqrt(curR * curR + curI * curI))) / log2;

    // let log_zn = Math.log(curR * curR + curI * curI) / 2;
    // let nu = Math.log(log_zn / log2) / log2;
    // let mu = step + 1 - nu;

    if (mu < 0) mu = 0;

    return [mu, true];
}
*/

// HSL
// Between 0 and 360, between 0 and 100, between 0 and 100
let colorPalette = [new HSL(120, 0, 0), new HSL(120, 100, 50), new HSL(240, 100, 50), new HSL(240, 100, 0)];

let globalElem, globalCtx;
let leftEdge, rightEdge, bottomEdge, topEdge, midReal, midImaginary, realRange, imaginaryRange;

let maxSteps = 20;
let distLimit = 3;
let distLimitSquared = distLimit * distLimit;

let drawWidth, drawHeight, drawWidthDiff, drawHeightDiff;
drawWidth = drawHeight = 256;

let pointsLeft, pointsDown;

let drawPoints;

function drawSet() {
    // let r;
    // let i;
    //
    // let curReal;
    // let curImaginary;

    /*console.time("Draw time");

    for (r = 0; r < globalElem.width; ++r) {
        curReal = (r / (globalElem.width - 1)) * realRange + leftEdge;
        for (i = 0; i < globalElem.height; ++i) {
            curImaginary = (i / (globalElem.height - 1)) * imaginaryRange + bottomEdge;

            const stepsTaken = findEscapeForValue(curReal, curImaginary, maxSteps, distLimitSquared);
            if (stepsTaken[1]) {
                const c = getColor(stepsTaken[0], maxSteps, colorPalette);
                globalCtx.fillStyle = "hsl(" + c.h + "," + c.s + "%," + c.l + "%)";
            } else {
                const c = colorPalette[colorPalette.length - 1];
                globalCtx.fillStyle = "hsl(" + c.h + "," + c.s + "%," + c.l + "%)";
            }

            globalCtx.fillRect(r, i, 1, 1);
        }
    }

    console.timeEnd("Draw time");*/

    drawPoints = spiral(pointsLeft, pointsDown);
    workerArray.forEach(function (worker) {
        if (drawPoints.length > 0) {
            let t = drawPoints.shift();
            let message = new WorkerInstructions(t.x, t.y, t.l, t.b, t.rR, t.rI, t.pxW, t.pxH);
            worker.postMessage(message);
        }
    });
}

let mouseDownX;
let mouseDownY;

function mouseDownCallback(e) {
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
}

function mouseUpCallback(e) {
    let newWidthPx = Math.abs(mouseDownX - e.clientX);
    let newHeightPx = Math.abs(mouseDownY - e.clientY);

    let oldRealRange = realRange;
    let oldImaginaryRange = imaginaryRange;

    if (newWidthPx === 0 && newHeightPx === 0) {
        return;
    }

    let leftEdgePx = mouseDownX < e.clientX ? mouseDownX : e.clientX;
    let bottomEdgePx = mouseDownY < e.clientY ? mouseDownY : e.clientY;
    rightEdge = ((leftEdgePx + newWidthPx) / globalElem.width) * realRange + leftEdge;
    topEdge = ((bottomEdgePx + newHeightPx) / globalElem.height) * imaginaryRange + bottomEdge;
    leftEdge = (leftEdgePx / globalElem.width) * realRange + leftEdge;
    bottomEdge = (bottomEdgePx / globalElem.height) * imaginaryRange + bottomEdge;

    realRange = rightEdge - leftEdge;
    imaginaryRange = topEdge - bottomEdge;

    let realRangeRatio = realRange / oldRealRange;
    let imaginaryRangeRatio = imaginaryRange / oldImaginaryRange;

    if (realRangeRatio > imaginaryRangeRatio) {
        let imaginaryRangeDiff = realRange * (oldImaginaryRange / oldRealRange) - imaginaryRange;

        topEdge += imaginaryRangeDiff / 2;
        bottomEdge -= imaginaryRangeDiff / 2;

        imaginaryRange = topEdge - bottomEdge;
    } else if (imaginaryRangeRatio > realRangeRatio) {
        let realRangeDiff = imaginaryRange * (oldRealRange / oldImaginaryRange) - realRange;

        rightEdge += realRangeDiff / 2;
        leftEdge -= realRangeDiff / 2;

        realRange = rightEdge - leftEdge;
    }

    drawSet();
}

let workerArray = [];

function init() {
    globalElem = document.getElementById("mandelbrot-canvas");
    globalCtx = globalElem.getContext("2d");

    globalElem.addEventListener("mousedown", mouseDownCallback);
    globalElem.addEventListener("mouseup", mouseUpCallback);

    leftEdge = -2.25;
    rightEdge = 0.75;
    bottomEdge = -1.5;
    topEdge = 1.5;

    globalElem.width = window.innerWidth;
    globalElem.height = window.innerHeight;

    console.log("Available cores: ", navigator.hardwareConcurrency);

    // globalElem.width = 1000;
    // globalElem.height = 1000;

    drawWidthDiff = window.innerWidth % drawWidth;
    drawHeightDiff = window.innerHeight % drawHeight;

    pointsLeft = Math.ceil(globalElem.width / drawWidth);
    pointsDown = Math.ceil(globalElem.height / drawHeight);

    midReal = (leftEdge + rightEdge) / 2;
    midImaginary = (bottomEdge + topEdge) / 2;

    if (globalElem.width > globalElem.height) {
        leftEdge = (leftEdge - midReal) * (globalElem.width / globalElem.height) + midReal;
        rightEdge = (rightEdge - midReal) * (globalElem.width / globalElem.height) + midReal;
    }
    if (globalElem.height > globalElem.width) {
        bottomEdge = (bottomEdge - midImaginary) * (globalElem.height / globalElem.width) + midImaginary;
        topEdge = (topEdge - midImaginary) * (globalElem.height / globalElem.width) + midImaginary;
    }

    if (workerArray.length > 0) {
        workerArray.forEach(function (worker) {
            worker.terminate();
        });
        workerArray = [];
    }

    for (let i = 0; i < navigator.hardwareConcurrency; ++i) {
        workerArray.push(new Worker("worker.js"));
        workerArray[i].onmessage = workerCallback;
        workerArray[i].postMessage(i);
    }

    realRange = rightEdge - leftEdge;
    imaginaryRange = topEdge - bottomEdge;

    drawSet();
}

let workerCallback = function (e) {
    /*console.log(e.data);
    for (let x = 0; x < e.data.arr.length; ++x) {
        let writeText = "";
        if (x < 10) writeText += "0";
        writeText += x + "|";
        for (let y = 0; y < e.data.arr[x].length; ++y) {
            if (e.data.arr[x][y] % 1 === 0) {
                writeText += "1";
            } else {
                writeText += "0";
            }
        }
        console.log(writeText);
    }*/
    let d = e.data;
    let a = d.arr;

    if (drawPoints.length > 0) {
        let t = drawPoints.shift();
        let message = new WorkerInstructions(t.x, t.y, t.l, t.b, t.rR, t.rI, t.pxW, t.pxH);
        workerArray[d.workerId].postMessage(message);
    }

    let imageData = globalCtx.createImageData(d.pxW, d.pxH);
    for (let y = 0; y < d.pxH; ++y) {
        for (let x = 0; x < d.pxW; ++x) {
            /*if (d.colored) {
                const c = a[y][x];
                globalCtx.fillStyle = "hsl(" + c.h + "," + c.s + "%," + c.l + "%)";
            } else {
                const c = getColor(a[y][x], d.maxSteps, colorPalette);
                globalCtx.fillStyle = "hsl(" + c.h + "," + c.s + "%," + c.l + "%)";
            }
            globalCtx.fillRect(x + d.startX, y + d.startY, 1, 1);*/
            const c = getColor(a[y][x], d.maxSteps, colorPalette);
            const rgb = hslToRgb(c.h / 360, c.s / 100, c.l / 100);
            const curOffset = y * d.pxW * 4 + x * 4;
            imageData.data[curOffset] = rgb.r;
            imageData.data[curOffset + 1] = rgb.g;
            imageData.data[curOffset + 2] = rgb.b;
            imageData.data[curOffset + 3] = 255;
            // globalCtx.fillStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
            // globalCtx.fillRect(x + d.startX, y + d.startY, 1, 1);
        }
    }
    globalCtx.putImageData(imageData, d.startX, d.startY);
};

window.onload = init;