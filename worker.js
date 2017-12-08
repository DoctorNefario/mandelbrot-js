let maxSteps, maxDist2, leftEdge, bottomEdge, rangeR, rangeI, pxW, pxH;
let workerId = -1;

const log2 = Math.log(2);

function t2(startR, startI, maxSteps, maxDist) {
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

function t() {
    let i;
    let r;

    let curR;
    let curI;

    let retArr = [];

    for (i = 0; i < pxH; ++i) {
        curI = (i / (pxH)) * rangeI + bottomEdge;
        retArr.push([]);
        for (r = 0; r < pxW; ++r) {
            curR = (r / (pxW)) * rangeR + leftEdge;
            const stepsTaken = t2(curR, curI, maxSteps, maxDist2);
            retArr[i].push(stepsTaken);
        }
    }

    return retArr;
}

onmessage = function(e) {
    let calcInfo = e.data;
    if (isNaN(calcInfo)) {
        maxSteps = calcInfo.maxSteps;
        maxDist2 = calcInfo.maxDistSquared;
        leftEdge = calcInfo.leftEdge;
        bottomEdge = calcInfo.bottomEdge;
        rangeR = calcInfo.rangeR;
        rangeI = calcInfo.rangeI;
        pxW = calcInfo.pxW;
        pxH = calcInfo.pxH;
        let returnData = {
            colored: calcInfo.returnColor,
            maxSteps: maxSteps,
            startX: calcInfo.startX,
            startY: calcInfo.startY,
            pxW: pxW,
            pxH: pxH,
            workerId: workerId,
            arr: t()
        };
        postMessage(returnData);
    } else {
        workerId = calcInfo;
    }
};