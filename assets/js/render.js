'use strict';

import elements from './elements.js';

const render = {
    init(){
        elements.cAsteroids.width = document.documentElement.clientWidth;
        elements.cAsteroids.height = document.documentElement.clientHeight;

    }
}

export default render;