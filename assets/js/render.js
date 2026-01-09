'use strict';

import elements from './elements.js';
import data from "./data.js";

const render = {
    init() {
        elements.cAsteroids.width = document.documentElement.clientWidth;
        elements.cAsteroids.height = document.documentElement.clientHeight;
        elements.cProjectiles.width = document.documentElement.clientWidth;
        elements.cProjectiles.height = document.documentElement.clientHeight;
    },
    asteroids() {
        elements.cAsteroids.getContext('2d').clearRect(
            0, 0,
            elements.cAsteroids.width,
            elements.cAsteroids.height
        );

        data.asteroids.forEach(asteroid => {
            asteroid.update();
            asteroid.draw();
        });
    },
    projectiles(){
        elements.cProjectiles.getContext('2d').clearRect(
            0, 0,
            elements.cProjectiles.width,
            elements.cProjectiles.height
        );

        data.projectiles.forEach(projectile => {
            projectile.update();
            projectile.draw();
        });
    }


}

export default render;