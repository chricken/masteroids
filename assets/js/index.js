'use strict';

import dom from "./dom.js";
import render from './render.js';
import noise from "./noise.js";
import Asteroid from './classes/Asteroid.js';
import data from "./data.js";
import game from "./game.js";

import connector from '/connector/index.js';
import Ship from "./classes/Ship.js";

const init = () => {
    connector.init();
    noise.init();
    dom.mapping();
    dom.appendEventListeners();
    render.init();

    data.ship = new Ship();
    for (let i = 0; i < data.numberOfAsteroids; i++) {
        new Asteroid();
    }

    // console.log(data.asteroids.map(asteroid => asteroid.position));

    game.start();

}

init();