'use strict';

import data from "./data.js";
import render from "./render.js";
import projectile from "./classes/Projectile.js";

const game = {
    start() {
        data.idGameInterval = setInterval(
            () => {
                game.update();
            },
            data.tickInterval
        );
    },
    update() {
        render.asteroids();
        render.projectiles();
    }
}

export default game;