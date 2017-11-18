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
        return new HSL(0, 0, 0);
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

    let step = maxSteps - stepsLeft;

    let mu = step + 1 - Math.log(Math.log(Math.sqrt(curR * curR + curI * curI))) / log2;

    if (isNaN(mu) || mu < 0) mu = 0;

    return mu;
}

// HSL
// Between 0 and 360, between 0 and 100, between 0 and 100
let colorPalette = [new HSL(120, 0, 0), new HSL(120, 100, 50), new HSL(240, 100, 50), new HSL(240, 100, 0)];

console.log(getColor(2, 4, colorPalette));
console.log(getColor(2.5, 5, colorPalette));
console.log(getColor(1, 3, colorPalette));

let stepGrid = [];

function colorTest() {
    const elem = document.getElementById("mandelbrot-canvas");
    const ctx = elem.getContext("2d");

    console.log(window.innerWidth, window.innerHeight, elem.width, elem.height);

    let r;
    let i;

    let curReal;
    let curImaginary;

    elem.width = window.innerWidth;
    elem.height = window.innerHeight;

    // elem.width = 1000;
    // elem.height = 1000;

    let leftEdge = -2.25;
    let rightEdge = 0.75;
    let bottomEdge = -1.5;
    let topEdge = 1.5;

    let midReal = (leftEdge + rightEdge) / 2;
    let midImaginary = (bottomEdge + topEdge) / 2;

    if (elem.width > elem.height) {
        leftEdge = (leftEdge - midReal) * (elem.width / elem.height) + midReal;
        rightEdge = (rightEdge - midReal) * (elem.width / elem.height) + midReal;
    }
    if (elem.height > elem.width) {
        bottomEdge = (bottomEdge - midImaginary) * (elem.height / elem.width) + midImaginary;
        topEdge = (topEdge - midImaginary) * (elem.height / elem.width) + midImaginary;
    }

    let realRange = rightEdge - leftEdge;
    let imaginaryRange = topEdge - bottomEdge;

    let maxSteps = 50;
    let distLimit = 3;
    let distLimitSquared = distLimit * distLimit;

    console.log(elem, ctx, elem.width, elem.height);

    // for (i = 0; i < elem.width; ++i) {
    //     iColor = getColor(i, elem.width - 1, colorPalette);
    //     ctx.fillStyle = "hsl(" + iColor.h + "," + iColor.s + "%," + iColor.l + "%)";
    //     ctx.fillRect(i, 0, 1, elem.height);
    // }

    let highest = 0;
    let lowest = maxSteps;

    console.time("test");

    for (r = 0; r < elem.width; ++r) {
        stepGrid.push([]);
        curReal = (r / (elem.width - 1)) * realRange + leftEdge;
        for (i = 0; i < elem.height; ++i) {
            curImaginary = (i / (elem.height - 1)) * imaginaryRange + bottomEdge;

            const stepsTaken = findEscapeForValue(curReal, curImaginary, maxSteps, distLimitSquared);
            // const c = getColor(stepsTaken, maxSteps, colorPalette);

            // ctx.fillStyle = "hsl(" + c.h + "," + c.s + "%," + c.l + "%)";
            // ctx.fillRect(r, i, 1, 1);

            stepGrid[r].push(stepsTaken);

            if (stepsTaken < lowest) {
                lowest = stepsTaken;
            } else if (stepsTaken > highest) {
                highest = stepsTaken;
            }
        }
    }
    console.timeEnd("test");

    let x;
    let y;
    for (x = 0; x < elem.width; ++x) {
        for (y = 0; y < elem.height; ++y) {
            const c = getColor(stepGrid[x][y], highest - 10, colorPalette);
            ctx.fillStyle = "hsl(" + c.h + "," + c.s + "%," + c.l + "%)";
            ctx.fillRect(x, y, 1, 1);
        }
    }

    console.log(stepGrid, lowest, highest);

}