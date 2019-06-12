function HSL(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
}

// HSL
// Between 0 and 360, between 0 and 100, between 0 and 100
let colorPalette = [new HSL(120, 0, 0), new HSL(120, 100, 50), new HSL(240, 100, 50), new HSL(240, 100, 0)];

let mandelElem, mandelCtx, mandelControls, mandelMessageContainer, mandelMessageSubcontainer;
let leftEdge, rightEdge, bottomEdge, topEdge, midReal, midImaginary, realRange, imaginaryRange;

let maxSteps = 20;
let distLimit = 3;
let distLimitSquared = distLimit * distLimit;

// Change this with CSS
const fadeTime = 600;
let messageTimeout = 2500;

let threadsRunning = 0;

let drawWidth, drawHeight, drawWidthDiff, drawHeightDiff;
drawWidth = drawHeight = 256;

let pointsLeft, pointsDown;

let drawPoints;

// Whether or not this is more efficient depends on how much waiting the main thread is doing
let workerDoesColor = true;
let workerArray = [];

let mandelMessages = [];
let fadingMandelMessages = [];


function WorkerInstructions(startX, startY, leftEdge, bottomEdge, realRange, imaginaryRange,
                            pixelsWidth, pixelsHeight) {
    this.messageType = "instructions";
    this.returnColor = workerDoesColor;
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
    if (workerDoesColor) {
        this.colorPalette = colorPalette;
    }
}

// Spiral selector, ported from Python
// Credit: https://stackoverflow.com/a/398302
function spiral(spiralW, spiralH) {
    let [x, y, dx, dy] = [0, 0, 0, -1];
    let max = Math.max(spiralW, spiralH) ** 2;
    let [halfSpiralX, halfSpiralY] = [spiralW / 2, spiralH / 2];

    let pointArray = [];
    for (let i = 0; i < max; ++i) {
        if ((-spiralW / 2 < x && x <= spiralW / 2) && (-spiralH / 2 < y && y <= spiralH / 2)) {
            let startX = (x + halfSpiralX - 1) * drawWidth;
            let startY = (y + halfSpiralY - 1) * drawHeight;
            let width = startX + drawWidth > mandelElem.width && drawWidthDiff > 0 ? drawWidthDiff : drawWidth;
            let height = startY + drawHeight > mandelElem.height && drawHeightDiff > 0 ? drawHeightDiff : drawHeight;

            pointArray.push({
                x: startX, y: startY, pxW: width, pxH: height,
                l: (startX / mandelElem.width) * realRange + leftEdge,
                b: (startY / mandelElem.height) * imaginaryRange + bottomEdge,
                rR: (width / mandelElem.width) * realRange,
                rI: (height / mandelElem.height) * imaginaryRange
            });
        }
        if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) [dx, dy] = [-dy, dx];
        [x, y] = [x + dx, y + dy];
    }
    return pointArray;
}

// Credit: https://stackoverflow.com/a/9493060
// Takes color as HSL, returns it as RGB
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

function showMessage(message, time = messageTimeout) {
    let messageElem = document.createElement("div");
    messageElem.className = "mandel-message fade-in";
    messageElem.textContent = message;
    mandelMessageSubcontainer.prepend(messageElem);
    mandelMessages.push(messageElem);

    setTimeout(hideMessage, time);
}

function hideMessage() {
    if (mandelMessages[0] != null) {
        let fadeMessage = mandelMessages.shift();
        fadeMessage.className = "mandel-message fade-out";
        fadingMandelMessages.push(fadeMessage);
        setTimeout(removeMessage, fadeTime);
    }
}

function removeMessage() {
    if (fadingMandelMessages[0] != null) fadingMandelMessages.shift().remove();
}

function getColor(number, maxNumber, colorPalette) {
    // TODO: Allow cycling around the color palette instead of just linear mapping each in order
    if (number === maxNumber) {
        return colorPalette[colorPalette.length - 1];
    } else if (number > maxNumber || number < 0) {
        // Fluro pink, to make errors obvious
        return new HSL(322, 96, 47);
    }

    const normalized = number / maxNumber;
    const mapped = normalized * (colorPalette.length - 1);

    const colorOne = colorPalette[Math.floor(mapped)];
    const colorTwo = colorPalette[Math.floor(mapped) + 1];

    if (colorOne === undefined || colorTwo === undefined) {
        throw("Undefined colors for number: " + number);
    }

    const finalH = (colorOne.h - colorTwo.h) * (1 - mapped % 1) + colorTwo.h;
    const finalS = (colorOne.s - colorTwo.s) * (1 - mapped % 1) + colorTwo.s;
    const finalV = (colorOne.l - colorTwo.l) * (1 - mapped % 1) + colorTwo.l;

    return new HSL(finalH, finalS, finalV);
}

// const log2 = Math.log(2);

// TODO: Find a better name. This function no longer draws the set
function drawSet() {
    console.time("draw");
    drawPoints = spiral(pointsLeft, pointsDown);
    workerArray.forEach(function (worker) {
        if (drawPoints.length > 0) {
            let t = drawPoints.shift();
            let message = new WorkerInstructions(t.x, t.y, t.l, t.b, t.rR, t.rI, t.pxW, t.pxH);
            worker.postMessage(message);
            ++threadsRunning;
        }
    });
}

function init() {
    mandelElem = document.getElementById("mandelbrot-canvas");
    mandelCtx = mandelElem.getContext("2d");

    mandelControls = document.getElementById("mandel-controls");
    mandelMessageContainer = document.getElementById("mandel-message-container");
    mandelMessageSubcontainer = document.getElementById("mandel-message-subcontainer");

    mandelElem.addEventListener("mousedown", mouseDownCallback);
    mandelElem.addEventListener("mouseup", mouseUpCallback);

    leftEdge = -2.25;
    rightEdge = 0.75;
    bottomEdge = -1.5;
    topEdge = 1.5;

    mandelElem.width = window.innerWidth;
    mandelElem.height = window.innerHeight;

    showMessage("Available cores: " + navigator.hardwareConcurrency || "unknown", 1000);

    // mandelElem.width = 1000;
    // mandelElem.height = 1000;

    drawWidthDiff = window.innerWidth % drawWidth;
    drawHeightDiff = window.innerHeight % drawHeight;

    pointsLeft = Math.ceil(mandelElem.width / drawWidth);
    pointsDown = Math.ceil(mandelElem.height / drawHeight);

    midReal = (leftEdge + rightEdge) / 2;
    midImaginary = (bottomEdge + topEdge) / 2;

    if (mandelElem.width > mandelElem.height) {
        leftEdge = (leftEdge - midReal) * (mandelElem.width / mandelElem.height) + midReal;
        rightEdge = (rightEdge - midReal) * (mandelElem.width / mandelElem.height) + midReal;
    }
    if (mandelElem.height > mandelElem.width) {
        bottomEdge = (bottomEdge - midImaginary) * (mandelElem.height / mandelElem.width) + midImaginary;
        topEdge = (topEdge - midImaginary) * (mandelElem.height / mandelElem.width) + midImaginary;
    }

    if (workerArray.length > 0) {
        workerArray.forEach(function (worker) {
            worker.terminate();
        });
        workerArray = [];
    }

    for (let i = 0; i < (navigator.hardwareConcurrency || 4); ++i) {
        workerArray.push(new Worker("mandelbrot-worker.js"));
        workerArray[i].onmessage = workerCallback;
        workerArray[i].postMessage({
            messageType: "identifier",
            identifier: i
        });
    }

    realRange = rightEdge - leftEdge;
    imaginaryRange = topEdge - bottomEdge;

    drawSet();
}

let mouseDownX;
let mouseDownY;

function mouseDownCallback(e) {
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
}

function mouseUpCallback(e) {
    if (mouseDownX == null || mouseDownY == null) {
        return;
    }

    let newWidthPx = Math.abs(mouseDownX - e.clientX);
    let newHeightPx = Math.abs(mouseDownY - e.clientY);

    let oldRealRange = realRange;
    let oldImaginaryRange = imaginaryRange;

    if (newWidthPx === 0 && newHeightPx === 0) {
        return;
    }

    let leftEdgePx = mouseDownX < e.clientX ? mouseDownX : e.clientX;
    let bottomEdgePx = mouseDownY < e.clientY ? mouseDownY : e.clientY;
    rightEdge = ((leftEdgePx + newWidthPx) / mandelElem.width) * realRange + leftEdge;
    topEdge = ((bottomEdgePx + newHeightPx) / mandelElem.height) * imaginaryRange + bottomEdge;
    leftEdge = (leftEdgePx / mandelElem.width) * realRange + leftEdge;
    bottomEdge = (bottomEdgePx / mandelElem.height) * imaginaryRange + bottomEdge;

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

    mouseDownX = mouseDownY = null;

    drawSet();
}

let workerCallback = function (e) {
    let d = e.data;
    let a = d.arr;

    if (drawPoints.length > 0) {
        let t = drawPoints.shift();
        let message = new WorkerInstructions(t.x, t.y, t.l, t.b, t.rR, t.rI, t.pxW, t.pxH);
        workerArray[d.workerId].postMessage(message);
    } else {
        --threadsRunning;
    }

    if (threadsRunning === 0) {
        console.timeEnd("draw");
    }

    let imageData = mandelCtx.createImageData(d.pxW, d.pxH);

    if (d.colored) {
        imageData.data.set(a);
    } else {
        for (let y = 0; y < d.pxH; ++y) {
            for (let x = 0; x < d.pxW; ++x) {
                const c = getColor(a[y][x], d.maxSteps, colorPalette);
                const rgb = hslToRgb(c.h / 360, c.s / 100, c.l / 100);

                const curOffset = y * d.pxW * 4 + x * 4;
                imageData.data[curOffset] = rgb.r;
                imageData.data[curOffset + 1] = rgb.g;
                imageData.data[curOffset + 2] = rgb.b;
                imageData.data[curOffset + 3] = 255;
            }
        }
    }
    mandelCtx.putImageData(imageData, d.startX, d.startY);
};

window.addEventListener("load", init, true);
