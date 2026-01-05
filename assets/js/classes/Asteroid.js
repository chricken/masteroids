'use strict';

import helpers from "../helpers.js";
import element from '../elements.js';

class Asteroid {
    constructor({
                    posX = Math.random(),
                    posY = Math.random(),
                    maxSpeed = .5,
                    minSpeed = .2,
                    roughness = .2,     // roughness von 1 bedeutet minRadius ist 0, maxRadius ist radius * 2
                    radius = .03,        // Basisradius als Anteil am Canvasbreite
                    resolution = 30,            // Number of Ecken
                    angle = 0,    // Winkel in Bogenmaß
                    direction = helpers.createNumberDec(0, 2 * Math.PI),    // Bewegungsrichtung
                } = {}) {
        Object.assign(
            this,
            {posX, posY, roughness, maxSpeed, radius, resolution, angle, direction}
        )

        // Resolution muss durch 4 teilbar sein
        this.resolution += this.resolution % 4;

        this.points = new Array(this.resolution);
        this.c = document.createElement('canvas');
        this.ctx = this.c.getContext('2d');
        this.speed = helpers.createNumberDec(minSpeed, maxSpeed)

        this.init();

        console.log(this);
    }

    init() {

        for (let i = 0; i < this.points.length; i += 4) {
            let distance = helpers.createNumberDec(0, this.roughness * this.radius);
            distance += this.radius + (distance * 2) - distance;
            this.points[i] = distance;
        }

        for (let i = 2; i < this.points.length; i += 4) {
            let distance = helpers.createNumberDec(0, this.roughness * this.radius);
            distance += this.radius + (distance * 2) - distance;
            this.points[i] = distance;
        }

        for (let i = 1; i < this.points.length; i += 2) {
            let distance = helpers.createNumberDec(0, this.roughness * this.radius);
            distance += this.radius + (distance * 2) - distance;
            this.points[i] = distance;
        }
        console.log(this.points);

    }

    render() {
        const canvas = element.spielfeld;
        const ctx = canvas.getContext('2d');

    }

    update() {
    }

    hitTest(x, y) {

    }

    hit(x, y) {
    }

}

export default Asteroid;