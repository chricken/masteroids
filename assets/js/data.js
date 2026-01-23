'use strict';

// Als Variable, um in dem Objekt drauf zugreifen zu könne
let numGrid = 10;

const data = {
    tickInterval: 30,
    idGameInterval: null,
    numberOfAsteroids: 10,

    maxInitSizeAsteroids: 200,
    minInitSizeAsteroids: 70,

    maxSpeedAsteroids: .005,
    maxSpeedPlayers: .01,
    maxSpeedDebris: .01,

    numGrid,
    asteroids: [],
    debris: [],
    projectiles: [],
    stations: [],
    enemies: [],
    ship: null,

    pressedKeys:new Set(),

    // 2-Dimensionales Raster
    // Jedes Rasterelement enthält Arrays für jeden Elemententyp
    // fill() hat nur ein Array erzeugt und dieses dann referenziert
    grid: [...new Array(numGrid)].map(() =>
        [...new Array(numGrid)].map(() => {
                return {
                    asteroids: [],
                    projectiles: [],
                    debris: [],
                    stations: [],
                    enemies: []
                }
            }
        )
    ),
}

export default data;