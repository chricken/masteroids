'use strict';

import helpers from "../helpers.js";
import elements from '../elements.js';
import noise from '../noise.js';

import Debris from './Debris.js';

class Asteroid {
    constructor({
                    seed1 = Math.random() * 1e17,
                    seed2 = Math.random() * 1e17,
                    seed3 = Math.random() * 1e17,
                    size = 256,
                    zoom = 50
                } = {}) {

        this.seed1 = seed1;
        this.seed2 = seed2;
        this.seed3 = seed3;
        this.size = size;
        this.zoom = zoom;
        this.id = crypto.randomUUID();
        this.position = {x: Math.random(), y: Math.random()};
        this.velocity = Math.random();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.radius = size / 2;
        // Die Gesundheit ergibt sich aus der Größe, weil je nach Schuss immer ein Teile aus dem Asteroiden heraus gesprengt wird
        this.isActive = true;

        // Hierauf wird die Textur aus der Perlin Map generiert
        this.cTexture = document.createElement('canvas');
        this.cTexture.width = this.size;
        this.cTexture.height = this.size;
        this.renderTexture(this.cTexture);

        // Hierauf wird die Maske gerendert
        this.cMask = document.createElement('canvas');
        this.cMask.width = this.size;
        this.cMask.height = this.size;
        this.renderMask({
            c: this.cMask
        });

        // Dies ist das Canvas, auf dem die finale Textur gerendert wird
        this.cRender = document.createElement('canvas');
        this.cRender.width = this.size;
        this.cRender.height = this.size;
        this.renderFull({
            c: this.cRender
        })

    }

    renderTexture(c) {
        const ctx = c.getContext('2d');
        noise.generatePerlinNoise({
            canvas: c,
            xOffset: this.seed1 % 4096,
            yOffset: this.seed2 % 4096,
            zOffset: this.seed3 % 4096,
            zoom: this.zoom,
            color1: [0, 0, 0],
            color2: [0, 0, 50],
        })
    }

    renderMask({
                   c,
               }) {
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(
            c.width / 2, c.height / 2, c.width / 2,
            c.height / 2, c.width / 2, c.height / 3,
        )
        grad.addColorStop(0, '#000');
        grad.addColorStop(1, '#fff');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, c.width, c.height);
    }

    renderFull({
                   c
               }) {
        const ctx = c.getContext('2d');

        // Draw the texture
        ctx.drawImage(this.cTexture, 0, 0);

        // Draw the mask with multiply blend mode
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(this.cMask, 0, 0);

        // Reset blend mode
        ctx.globalCompositeOperation = 'source-over';
    }


    draw() {
        const ctxAsteroids = elements.cAsteroids.getContext('2d');
        console.log(this);

        ctxAsteroids.drawImage(
            this.cRender,
            this.position.x * elements.cAsteroids.width - this.size / 2,
            this.position.y * elements.cAsteroids.height - this.size / 2);
    }


}

export default Asteroid;