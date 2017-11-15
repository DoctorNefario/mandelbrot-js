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

    var normalized = number / maxNumber;
    var mapped = normalized * (colorPalette.length - 1);

    var colorOne = colorPalette[Math.floor(mapped)];
    var colorTwo = colorPalette[Math.floor(mapped) + 1];

    var finalH = (colorOne.h - colorTwo.h) * (1 - mapped % 1) + colorTwo.h;
    var finalS = (colorOne.s - colorTwo.s) * (1 - mapped % 1) + colorTwo.s;
    var finalV = (colorOne.l - colorTwo.l) * (1 - mapped % 1) + colorTwo.l;

    return new HSL(finalH, finalS, finalV);
}

// HSL
// Between 0 and 360, between 0 and 100, between 0 and 100
var colorPalette = [new HSL(0, 100, 50), new HSL(120, 100, 50), new HSL(240, 100, 50), new HSL(360, 100, 100)];

console.log(getColor(2, 4, colorPalette));
console.log(getColor(2.5, 5, colorPalette));
console.log(getColor(1, 3, colorPalette));

function colorTest() {
    var elem = document.getElementById("mandelbrot-canvas");
    var ctx = elem.getContext("2d");

    console.log(elem, ctx);

    for (var i = 0; i < elem.width; ++i) {
        var iColor = getColor(i, elem.width - 1, colorPalette);
        ctx.fillStyle = "hsl(" + iColor.h + "," + iColor.s + "%," + iColor.l + "%)";
        console.log(ctx.fillStyle);
        ctx.fillRect(i, 0, 1, elem.height);
    }

}