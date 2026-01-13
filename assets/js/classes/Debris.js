import helpers from "../helpers.js";
import elements from "../elements.js";
import data from "../data.js";

export default class Debris {
    constructor({
                    x,
                    y,
                    velocity = Math.random() * 1 + .1,
                    direction = Math.random() * 2 * Math.PI,
                    angle = 0,
                    rotationSpeed = Math.random() * .1 - .05,
                    composition = 'silicon',
                    size = helpers.createNumber(10, 30),
                    opacity = 1,
                    lifeSpanMin = 5000,
                    lifeSpanMax = 10000,
                } = {}
    ) {
        Object.assign(this, {
            position: {x, y},
            composition,
            velocity,
            direction,
            size,
            angle,
            rotationSpeed,
            lifeSpanMin,
            lifeSpanMax,
            opacity
        })

        this.id = crypto.randomUUID();
        this.lifespan = Math.floor(Math.random() *( lifeSpanMax - lifeSpanMin)) + lifeSpanMin;
        this.isActive = true;
        this.spawnTime = Date.now();

        this.c = document.createElement('canvas');
        this.c.width = size;
        this.c.height = size;
        this.ctx = this.c.getContext('2d');

        this.path = [...new Array(helpers.createNumber(6, 12))].map(() => {
            let r = this.c.width / 2;
            return Math.random() * (r * .25) + (r * .75);
        });
        this.render();
        data.debris.push(this);
    }

    render() {
        let color;
        switch (this.composition) {
            case 'iron':
                color = '#888888';
                break;
            case 'gold':
                color = '#FFD700';
                break;
            case 'silicon':
                color = '#aba';
                break;
            default:
                color = '#FFFFFF';
        }

        this.ctx.beginPath();
        // this.ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);

        for (let i = 0; i < this.path.length; i++) {
            const dist = this.path[i];
            const x = (this.c.width / 2) + Math.cos(i * (2 * Math.PI / this.path.length)) * dist;
            const y = (this.c.height / 2) + Math.sin(i * (2 * Math.PI / this.path.length)) * dist;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();

    }

    draw() {
        const c = elements.cDebris;
        const ctx = c.getContext('2d');

        ctx.globalAlpha = this.opacity;
        ctx.drawImage(
            this.c,
            this.position.x - (this.size / 2),
            this.position.y - (this.size / 2),
        )

    }

    update() {
        let relTime = (Date.now() - this.spawnTime) / this.lifespan; // Wert 0 -> 1
        if (relTime > 1) {
            this.isActive = false;
            return false;
        }
        this.angle += this.rotationSpeed;
        this.position.x += Math.cos(this.direction) * this.velocity;
        this.position.y += Math.sin(this.direction) * this.velocity;
        this.opacity = Math.min(1,(1 - relTime)*5);
        return true;
    }
    checkDistanceCollision(shipX, shipY, shipRadius) {
        const dx = this.position.x - shipX;
        const dy = this.position.y - shipY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < shipRadius + this.size;
    }

    getResourceValue() {
        switch (this.composition) {
            case 'iron':
                return 10;
            case 'gold':
                return 50;
            case 'silicon':
                return 5;
            default:
                return 0;
        }
    }

}
