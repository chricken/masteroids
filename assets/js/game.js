'use strict';

import data from "./data.js";
import render from "./render.js";

const game = {
    start() {
        data.idGameInterval = setInterval(
            () => {
                game.updateAsteroids();
            },
            data.tickInterval
        );
    },
    updateAsteroids() {
        data.asteroids.forEach(asteroid => {
            asteroid.update();
        });
        render.asteroids();
    }
}

export default game;