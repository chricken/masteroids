'use strict';

import dom from "./dom.js";
import render from './render.js';
import noise from "./noise.js";
import Asteroid from './classes/Asteroid.js';
import data from "./data.js";
import game from "./game.js";

const init = () => {
    noise.init();
    dom.mapping();
    render.init();

    for (let i = 0; i < data.numberOfAsteroids; i++) {
        new Asteroid();
    }
    console.log(data.asteroids.map(asteroid => asteroid.position));


    game.start();

}

init();