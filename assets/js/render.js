'use strict';

import elements from './elements.js';

const render = {
    init(){
        elements.spielfeld.width = document.documentElement.clientWidth;
        elements.spielfeld.height = document.documentElement.clientHeight;

    }
}

export default render;