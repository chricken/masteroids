export default class Debris {
    constructor(x, y, velocity, composition, size) {
        this.id = crypto.randomUUID();
        this.position = { x, y };
        this.velocity = velocity;
        this.composition = composition;
        this.size = size || Math.floor(Math.random() * 6) + 2;
        this.lifespan = Math.floor(Math.random() * 3000) + 2000;
        this.isActive = true;
        this.spawnTime = Date.now();
    }

    update(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

        if (Date.now() - this.spawnTime > this.lifespan) {
            this.isActive = false;
            return false;
        }

        return true;
    }

    render(ctx) {
        let color;
        switch (this.composition) {
            case 'iron':
                color = '#888888';
                break;
            case 'gold':
                color = '#FFD700';
                break;
            case 'silicon':
                color = '#ADD8E6';
                break;
            default:
                color = '#FFFFFF';
        }

        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
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

    static createRandomDebris(x, y, composition) {
        const velocity = {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4,
        };
        const size = Math.floor(Math.random() * 6) + 2;
        return new Debris(x, y, velocity, composition, size);
    }
}
