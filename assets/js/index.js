'use strict';

import dom from "./dom.js";
import render from './render.js';
import Asteroid from './classes/Asteroid.js';

const init = () =>{
    dom.mapping();
    render.init();
    new Asteroid().render();
    new Asteroid().render();
    new Asteroid().render();
}

init();