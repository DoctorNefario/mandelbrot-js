function HSL(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
}

// Takes color as HSL, returns it as RGB
function getColor(number, maxNumber, colorPalette) {
    if (number === maxNumber) {
        return colorPalette[colorPalette.length - 1];
    }

    const normalized = number / maxNumber;
    const mapped = normalized * (colorPalette.length - 1);

    const colorOne = colorPalette[Math.floor(mapped)];
    const colorTwo = colorPalette[Math.floor(mapped) + 1];

    const finalH = (colorOne.h - colorTwo.h) * (1 - mapped % 1) + colorTwo.h;
    const finalS = (colorOne.s - colorTwo.s) * (1 - mapped % 1) + colorTwo.s;
    const finalV = (colorOne.l - colorTwo.l) * (1 - mapped % 1) + colorTwo.l;

    return new HSL(finalH, finalS, finalV);
}

// HSL
// Between 0 and 360, between 0 and 100, between 0 and 100
let colorPalette = [new HSL(0, 100, 50), new HSL(120, 100, 50), new HSL(240, 100, 50), new HSL(360, 100, 50)];

console.log(getColor(2, 4, colorPalette));
console.log(getColor(2.5, 5, colorPalette));
console.log(getColor(1, 3, colorPalette));

function colorTest() {
    const elem = document.getElementById("mandelbrot-canvas");
    const ctx = elem.getContext("2d");

    console.log(window.innerWidth, window.innerHeight, elem.width, elem.height);

    let iColor;
    let i;

    elem.width = window.innerWidth;
    elem.height = window.innerHeight;

    console.log(elem, ctx);

    for (i = 0; i < elem.width; ++i) {
        iColor = getColor(i, elem.width - 1, colorPalette);
        ctx.fillStyle = "hsl(" + iColor.h + "," + iColor.s + "%," + iColor.l + "%)";
        ctx.fillRect(i, 0, 1, elem.height);
    }

}