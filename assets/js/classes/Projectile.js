'use strict';

import data from "../data.js";
import helpers from "../helpers.js";
import elements from '../elements.js';

class Projectile {
    constructor({
                    posX = 0,
                    posY = 0,
                    speed = 0,
                    direction = 0,
                    id = null,
                    streuung = .2,
                    target = null,
                    aiming = null,

                }) {

        Object.assign(this, {posX, posY, speed,})
        streuung = Math.random() * (streuung * 2) - streuung
        this.direction = direction + streuung;

        this.id = id ? id : helpers.createID();

        this.renderSprite();

        data.projectiles.push(this);
    }

    renderSprite() {
        this.c = document.createElement('canvas');
        let w = 20, h = 20;
        this.c.width = w;
        this.c.height = h;
        const ctx = this.c.getContext('2d');

        ctx.beginPath()

        ctx.moveTo(w, h / 2);
        ctx.lineTo(w / 4 * 3, h / 3 * 2);
        ctx.lineTo(0, h / 2);
        ctx.lineTo(w / 4 * 3, h / 3);

        ctx.fillStyle = '#ffa';
        ctx.fill();

    }

    draw() {
        const ctx = elements.cProjectiles.getContext('2d');

        ctx.save();
        ctx.translate(this.posX, this.posY);
        ctx.rotate(this.direction);
        ctx.drawImage(this.c, -this.c.width / 2, -this.c.height / 2);
        ctx.restore();
    }

    update() {
        const c = elements.cProjectiles;
        this.posX += Math.cos(this.direction) * (this.speed * c.width);
        this.posY += Math.sin(this.direction) * (this.speed * c.height);
        if (
            this.posX < 0
            || this.posX > c.width
            || this.posY < 0
            || this.posY > c.height
        )
            data.projectiles = data.projectiles.filter(p => p !== this);
    }
}

export default Projectile;