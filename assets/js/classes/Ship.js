'use strict';

import helpers from "../helpers.js";
import elements from '../elements.js';
import data from "../data.js";

class Ship {
    constructor({
                    id = null,
                    size = 64,
                    lineWidth = 3,
                    thrust = .0002,
                    rotationThrust = .003,
                } = {}) {

        this.id = id ? id : helpers.createID();
        this.size = size;
        this.lineWidth = lineWidth;
        this.position = {x: .5, y: .5};
        // this.velocity = 0;
        this.velocity = {x: 0, y: 0};
        this.velocityMax = .03;
        this.deceleration = .01;
        this.thrust = thrust;

        this.movementAngle = 0;

        this.rotation = 0;
        this.rotationSpeed = 0;
        this.rotationSpeedMax = 0.2;
        this.rotationThrust = rotationThrust;
        this.rotationDecelerate = .01;

        this.maxSpeed = .05;

        this.cRender = document.createElement('canvas');
        this.cRender.width = this.size;
        this.cRender.height = this.size;
        this.render();
        // document.body.append(this.cRender);
    }

    update() {
        // Rotation wie gehabt
        if (data.pressedKeys.has('ArrowRight') || data.pressedKeys.has('d')) {
            this.rotationSpeed += this.rotationThrust;
            this.rotationSpeed = Math.min(this.rotationSpeed, this.rotationSpeedMax)
        }
        if (data.pressedKeys.has('ArrowLeft') || data.pressedKeys.has('a')) {
            this.rotationSpeed -= this.rotationThrust;
            this.rotationSpeed = Math.max(this.rotationSpeed, -this.rotationSpeedMax)
        }
        this.rotationSpeed *= (1 - this.rotationDecelerate);
        this.rotation += this.rotationSpeed;

        // Schub geben (in Blickrichtung)
        if (data.pressedKeys.has('ArrowUp') || data.pressedKeys.has('w')) {
            // Blickrichtung: this.rotation - 0.5 * Math.PI (wie gehabt)
            const angle = this.rotation - 0.5 * Math.PI;
            this.velocity.x += Math.cos(angle) * this.thrust;
            this.velocity.y += Math.sin(angle) * this.thrust;
        }

        // Geschwindigkeit begrenzen
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (speed > this.velocityMax) {
            this.velocity.x *= this.velocityMax / speed;
            this.velocity.y *= this.velocityMax / speed;
        }

        // Position aktualisieren
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Geschwindigkeit verringern, wenn kein Schub gegeben wird (Trägheit)
        if (!data.pressedKeys.has('ArrowUp') && !data.pressedKeys.has('w')) {
            this.velocity.x *= (1 - this.deceleration);
            this.velocity.y *= (1 - this.deceleration);
        }

        // Bildschirmbegrenzung (Wrap-Around)
        this.position.x = (this.position.x + 1) % 1;
        this.position.y = (this.position.y + 1) % 1;
        /*
        if (this.position.x < 0) this.position.x = 1
        if (this.position.x > 1) this.position.x = 0
        if (this.position.y < 0) this.position.y = 1
        if (this.position.y > 1) this.position.y = 0
        */

    }

    draw() {
        const c = elements.cShip;
        const ctx = c.getContext('2d');

        ctx.save()
        /*
                ctx.translate(
                    elements.cShip.width * this.position.x,
                    elements.cShip.height * this.position.y
                );

         */

        ctx.translate(
            elements.cShip.width/2,
            elements.cShip.height/2
        );
        ctx.rotate(this.rotation);

        ctx.drawImage(
            this.cRender,
            -this.size / 2,
            -this.size / 2
        )

        ctx.restore()
    }

    render() {
        // console.log(this);
        const c = this.cRender;
        const ctx = c.getContext('2d');

        ctx.beginPath();
        ctx.lineWidth = this.lineWidth;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#aaa';
        ctx.fillStyle = '#333';

        ctx.moveTo(c.width / 2, this.lineWidth);
        ctx.lineTo(c.width / 4 * 3, c.height / 4 * 3);
        ctx.lineTo(c.width / 2, c.height - this.lineWidth);
        ctx.lineTo(c.width / 4, c.height / 4 * 3);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c.width / 4 * 3, c.height / 4 * 3);
        ctx.lineTo(c.width / 2, c.height / 1.5);
        ctx.lineTo(c.width / 4, c.height / 4 * 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c.width / 4 * 3, c.height / 4 * 3);
        ctx.lineTo(c.width / 2, c.height / 1.1);
        ctx.lineTo(c.width / 4, c.height / 4 * 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c.width / 2, c.height * .9);
        ctx.lineTo(c.width / 2, c.height / 3);
        ctx.stroke();
    }

}

export default Ship