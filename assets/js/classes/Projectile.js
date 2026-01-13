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
                    impulse = .02,    // Wieviel Energie wird an den Asteroiden übertragen?
                    punch = 5       // Wie groß ist das Loch, das gerissen wird?
                }) {

        Object.assign(this, {posX, posY, speed, gridX, gridY, impulse, punch})
        streuung = Math.random() * (streuung * 2) - streuung
        this.direction = direction + streuung;

        this.id = id ? id : helpers.createID();

        this.renderSprite();

        data.projectiles.push(this);
        this.assignGrid();
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
        // Vorberechnete Werte für die innere Schleife
        const canvasWidth = elements.cAsteroids.width;
        const canvasHeight = elements.cAsteroids.height;
        const pX = this.posX;
        const pY = this.posY;
        const maxGrid = data.numGrid - 1;

        // Grid-Grenzen vorberechnen (clamp)
        const minX = Math.max(0, this.gridX - 1);
        const maxX = Math.min(maxGrid, this.gridX + 1);
        const minY = Math.max(0, this.gridY - 1);
        const maxY = Math.min(maxGrid, this.gridY + 1);

        // Nur relevante Felder durchlaufen
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                let boxAsteroid = data.grid[x][y].asteroids;
                let len = boxAsteroid.length;

                for (let i = 0; i < len; i++) {
                    const ast = boxAsteroid[i];

                    // Distanz ohne Math.hypot (schneller)
                    const dx = (ast.position.x * canvasWidth) - pX;
                    const dy = (ast.position.y * canvasHeight) - pY;
                    const distSq = dx * dx + dy * dy;
                    const radiusSq = ast.radius * ast.radius;

                    // Quadrierte Distanz-Vergleich (spart sqrt)
                    if (distSq < radiusSq) {
                        if (ast.hit(this)) {
                            this.destroy();
                            return false;
                        }
                    }
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