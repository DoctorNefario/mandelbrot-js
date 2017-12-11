function HSL(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
}

let maxSteps, maxDist2, leftEdge, bottomEdge, rangeR, rangeI, pxW, pxH;
let workerId = -1;

let colorPalette = [];


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

function getColor(number, maxNumber) {
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

    if (finalH == null || finalS == null || finalV == null) throw("error");

    // return hslToRgb(finalH / 360, finalS / 100, finalV / 100);
    return new HSL(finalH, finalS, finalV);
}

const log2 = Math.log(2);

function getEscape(startR, startI, maxSteps, maxDist) {
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

    if (stepsLeft === 0) return maxSteps;


    let step = maxSteps - stepsLeft;

    // return step;

    if (step === maxSteps) return step;

    // let mu = step + 1 - Math.log(Math.log(Math.sqrt(curR * curR + curI * curI))) / log2;

    let log_zn = Math.log(curR * curR + curI * curI) / 2;
    let nu = Math.log(log_zn / log2) / log2;
    let mu = step + 1 - nu;

    if (mu < 0) mu = 0;

    return mu;
}


function getAllEscapes() {
    let i, r;

    let curR;
    let curI;

    let retArr = [];

    for (i = 0; i < pxH; ++i) {
        curI = (i / (pxH)) * rangeI + bottomEdge;
        retArr.push([]);
        for (r = 0; r < pxW; ++r) {
            curR = (r / (pxW)) * rangeR + leftEdge;
            const stepsTaken = getEscape(curR, curI, maxSteps, maxDist2);
            retArr[i].push(stepsTaken);
        }
    }

    return retArr;
}

function getAllColors() {
    let i, r;

    let curR;
    let curI;

    let retArr = new Uint8ClampedArray(pxW * pxH * 4);

    for (i = 0; i < pxH; ++i) {
        curI = (i / (pxH)) * rangeI + bottomEdge;
        for (r = 0; r < pxW; ++r) {
            curR = (r / (pxW)) * rangeR + leftEdge;
            const stepsTaken = getEscape(curR, curI, maxSteps, maxDist2);
            const hsl = getColor(stepsTaken, maxSteps);
            const rgb = hslToRgb(hsl.h / 360, hsl.s / 100, hsl.l / 100);

            // if (rgb.r == null || rgb.g == null || rgb.b == null) throw("error " + JSON.stringify(rgb) + " thread: " + workerId);

            const curOffset = i * pxW * 4 + r * 4;

            retArr[curOffset] = rgb.r;
            retArr[curOffset + 1] = rgb.g;
            retArr[curOffset + 2] = rgb.b;
            retArr[curOffset + 3] = 255;
        }
    }

    return retArr;
}

function useInstructions(info) {
    if (workerId < 0) {
        throw("Uninitialized worker, no ID");
    }

    maxSteps = info.maxSteps;
    maxDist2 = info.maxDistSquared;
    leftEdge = info.leftEdge;
    bottomEdge = info.bottomEdge;
    rangeR = info.rangeR;
    rangeI = info.rangeI;
    pxW = info.pxW;
    pxH = info.pxH;

    let returnData = {
        colored: info.returnColor,
        maxSteps: maxSteps,
        startX: info.startX,
        startY: info.startY,
        pxW: pxW,
        pxH: pxH,
        workerId: workerId
    };

    if (info.returnColor) {
        colorPalette = info.colorPalette;

        returnData.arr = getAllColors();
    } else {
        returnData.arr = getAllEscapes();
    }

    postMessage(returnData);
}

onmessage = function(e) {
    let info = e.data;

    switch (info.messageType) {
        case "identifier":
            if (info.identifier != null) workerId = info.identifier;
            else throw("No ID with identifier message");
            break;
        case "instructions":
            useInstructions(info);
            break;
        default:
            console.log("Error, unknown message type:", info.messageType);
    }

};