function HSL(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
}

// Takes color as HSL, returns it as RGB
function getColor(number, maxNumber, colorPalette) {
    if (number === maxNumber) {
        return colorPalette[colorPalette.length - 1];
    } else if (number > maxNumber || number < 0) {
        // return new HSL(0, 0, 0);
        return new HSL(10, 10, 10);
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

const log2 = Math.log(2);

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

    if (isNaN(mu) || mu < 0) mu = 0;

    return [mu, true];
}

// HSL
// Between 0 and 360, between 0 and 100, between 0 and 100
let colorPalette = [new HSL(120, 0, 0), new HSL(120, 100, 50), new HSL(240, 100, 50), new HSL(240, 100, 0)];

console.log(getColor(2, 4, colorPalette));
console.log(getColor(2.5, 5, colorPalette));
console.log(getColor(1, 3, colorPalette));

// let stepGrid = [];

let globalElem, globalCtx;
let leftEdge, rightEdge, bottomEdge, topEdge, midReal, midImaginary, realRange, imaginaryRange;

let maxSteps = 50;
let distLimit = 3;
let distLimitSquared = distLimit * distLimit;

function drawSet() {
    console.log(window.innerWidth, window.innerHeight, globalElem.width, globalElem.height);

    let r;
    let i;

    let curReal;
    let curImaginary;

    globalElem.width = window.innerWidth;
    globalElem.height = window.innerHeight;

    // elem.width = 1000;
    // elem.height = 1000;

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

    realRange = rightEdge - leftEdge;
    imaginaryRange = topEdge - bottomEdge;

    console.log(globalElem, globalCtx, globalElem.width, globalElem.height);

    // for (i = 0; i < elem.width; ++i) {
    //     iColor = getColor(i, elem.width - 1, colorPalette);
    //     ctx.fillStyle = "hsl(" + iColor.h + "," + iColor.s + "%," + iColor.l + "%)";
    //     ctx.fillRect(i, 0, 1, elem.height);
    // }

    // let highest = 0;
    // let lowest = maxSteps;

    console.time("test");

    for (r = 0; r < globalElem.width; ++r) {
        // stepGrid.push([]);
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

            // stepGrid[r].push(stepsTaken);

            // if (stepsTaken < lowest) {
            //     lowest = stepsTaken;
            // } else if (stepsTaken > highest) {
            //     highest = stepsTaken;
            // }
        }
    }
    console.timeEnd("test");

    // let x;
    // let y;
    // for (x = 0; x < elem.width; ++x) {
    //     for (y = 0; y < elem.height; ++y) {
    //         const c = getColor(stepGrid[x][y], highest, colorPalette);
    //         ctx.fillStyle = "hsl(" + c.h + "," + c.s + "%," + c.l + "%)";
    //         ctx.fillRect(x, y, 1, 1);
    //     }
    // }

    // console.log(stepGrid, lowest, highest);

}

let mouseDownX;
let mouseDownY;

function mouseDownCallback(e) {
    console.log(e.clientX, e.clientY);
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
}

function mouseUpCallback(e) {
    let newWidthPx = Math.abs(mouseDownX - e.clientX);
    let newHeightPx = Math.abs(mouseDownY - e.clientY);
    console.log(newWidthPx, newHeightPx);
    if (newWidthPx === 0 || newHeightPx === 0) {
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

    drawSet()
}

function init() {
    globalElem = document.getElementById("mandelbrot-canvas");
    globalCtx = globalElem.getContext("2d");

    globalElem.addEventListener("mousedown", mouseDownCallback);
    globalElem.addEventListener("mouseup", mouseUpCallback);

    leftEdge = -2.25;
    rightEdge = 0.75;
    bottomEdge = -1.5;
    topEdge = 1.5;

    drawSet();
}