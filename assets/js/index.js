'use strict';

import dom from "./dom.js";
import render from './render.js';
import noise from "./noise.js";
import Asteroid from './classes/Asteroid.js';

const init = () => {
    noise.init();
    dom.mapping();
    render.init();
    new Asteroid().draw();
    new Asteroid().draw();
    new Asteroid().draw();
}

init();