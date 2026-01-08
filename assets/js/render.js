'use strict';

import elements from './elements.js';
import data from "./data.js";

const render = {
    init() {
        elements.cAsteroids.width = document.documentElement.clientWidth;
        elements.cAsteroids.height = document.documentElement.clientHeight;

    },
    asteroids() {
        elements.cAsteroids.getContext('2d').clearRect(
            0, 0,
            elements.cAsteroids.width,
            elements.cAsteroids.height
        );
        data.asteroids.forEach(asteroid => {
            asteroid.draw();
        });
    }

}

export default render;