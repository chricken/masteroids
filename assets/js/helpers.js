'use strict';

let counter = 1;

const helpers = {
    createNumber(min = 0, max = 100) {
        return ~~(Math.random() * (max - min + 1) + min);
    },
    createNumberDec(min = 0, max = 4, dec = 8) {
        let value = Math.random() * (max - min + 1) + min;
        value = value.toFixed(dec)
        return +value;
    },
    createID(){
        return `${Date.now().toString(36)}_${counter++}`
    }
}

export default helpers;