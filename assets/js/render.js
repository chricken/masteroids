'use strict';

import elements from './elements.js';
import data from "./data.js";

const render = {
    init() {
        elements.cAsteroids.width = document.documentElement.clientWidth;
        elements.cAsteroids.height = document.documentElement.clientHeight;
        elements.cProjectiles.width = document.documentElement.clientWidth;
        elements.cProjectiles.height = document.documentElement.clientHeight;
        elements.cDebris.width = document.documentElement.clientWidth;
        elements.cDebris.height = document.documentElement.clientHeight;
        elements.cShip.width = document.documentElement.clientWidth;
        elements.cShip.height = document.documentElement.clientHeight;
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
    },
    debris(){
        elements.cDebris.getContext('2d').clearRect(
            0, 0,
            elements.cDebris.width,
            elements.cDebris.height
        );

        // Inaktive Debris entfernen, ohne die Reihenfolge zu stören
        const activeDebris = [];
        data.debris.forEach(debris => {
            debris.update();
            debris.draw();
            debris.isActive && (activeDebris.push(debris));
        });
        data.debris = activeDebris;
    },
    ship(){
        elements.cShip.getContext('2d').clearRect(
            0, 0,
            elements.cShip.width,
            elements.cShip.height
        )
        data.ship.update();
        data.ship.draw();
    }

}

export default render;