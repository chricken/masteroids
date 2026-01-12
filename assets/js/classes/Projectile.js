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
                    streuung = .02,
                    target = null,
                    aiming = null,
                    gridX = 0,
                    gridY = 0,
                }) {

        Object.assign(this, {posX, posY, speed, gridX, gridY})
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

        /*
        ctx.fillStyle = '#ff0';
        ctx.font = '30px Tahoma, Geneva, Verdana, sans-serif';
        ctx.fillText(
            `${this.gridX}, ${this.gridY}`,
            this.posX,
            this.posY
        )
        */
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
        ) {
            data.projectiles = data.projectiles.filter(p => p !== this);
        }
        this.assignGrid();
        this.hitTest();
    }

    hitTest() {
        let boxAsteroid = data.grid[this.gridX][this.gridY].asteroids;
        for (let i = 0; i < boxAsteroid.length; i++) {
            const ast = boxAsteroid[i];
            let distance = Math.hypot(
                (ast.position.x * elements.cAsteroids.width) - this.posX,
                (ast.position.y * elements.cAsteroids.height) - this.posY,
            )
            // console.log(ast.radius, distance);
            if (distance < ast.radius) {
                if (ast.hit(this)) {
                    this.destroy();
                    return false;
                }
            }
        }
    }

    destroy() {
        let index = data.projectiles.indexOf(this);
        data.projectiles.splice(index, 1);

        let gProj = data.grid[this.gridX][this.gridY].projectiles;
        index = gProj.indexOf(this);
        gProj.splice(index, 1);
    }

    assignGrid() {
        let posX = this.posX / elements.cProjectiles.width;
        let posY = this.posY / elements.cProjectiles.height;
        // Berechnen, in welchem Grid der Asteroid liegt (optimiert)
        let gridX = Math.floor(posX * data.numGrid);
        let gridY = Math.floor(posY * data.numGrid);

        // Clamp in einem Schritt
        gridX = Math.min(Math.max(gridX, 0), data.numGrid - 1);
        gridY = Math.min(Math.max(gridY, 0), data.numGrid - 1);

        // vom bisherigen Grid in neuen Grid verschieben
        // console.log(this.gridX, gridX);

        if (this.gridX !== gridX || this.gridY !== gridY) {
            let oldGrid = data.grid[this.gridX][this.gridY].projectiles;

            // Schnellerer Remove: splice mit 2. Parameter
            let oldIndex = oldGrid.indexOf(this);
            if (oldIndex !== -1) oldGrid.splice(oldIndex, 1);

            // Gridbox umstellen und Asteroid hier einhängen
            this.gridX = gridX;
            this.gridY = gridY;
            data.grid[gridX][gridY].projectiles.push(this);
        }
    }
}

export default Projectile;