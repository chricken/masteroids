'use strict';

// Als Variable, um in dem Objekt drauf zugreifen zu könne
let numGrid = 10;

const data = {
    tickInterval: 30,
    idGameInterval: null,
    numberOfAsteroids: 10,

    maxInitSizeAsteroids: 150,
    minInitSizeAsteroids: 90,

    maxSpeedAsteroids: .003,
    maxSpeedPlayers: .01,
    maxSpeedDebris: .01,

    numGrid,
    asteroids: [],
    debris: [],
    projectiles: [],
    // 2-Dimensionales Raster
    raster: new Array(numGrid).fill(new Array(numGrid)),
    stations: [],
    enemies: []
}

export default data;