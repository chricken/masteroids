'use strict';

import helpers from "../helpers.js";
import elements from '../elements.js';
import noise from '../noise.js';

import Debris from './Debris.js';
import data from "../data.js";

let count = 0;

class Asteroid {
    constructor({
                    seed1 = Math.random() * 1e17,
                    seed2 = Math.random() * 1e17,
                    seed3 = Math.random() * 1e17,
                    size = helpers.createNumber(
                        data.minInitSizeAsteroids,
                        data.maxInitSizeAsteroids
                    ),
                    zoom = 35,
                    outlineMinValue = 70,
                    outlineMaxValue = 100,
                    displacementStrength = 60,
                    id = null,
                    gridX = 0,
                    gridY = 0,
                } = {}) {

        Object.assign(this, {
            seed1,
            seed2,
            seed3,
            size,
            zoom,
            outlineMinValue,
            outlineMaxValue,
            displacementStrength,
            gridX,
            gridY
        });
        this.maxDistance = this.size / 2 * .7;
        this.id = id ? id : helpers.createID();
        this.position = {x: Math.random(), y: Math.random()};
        this.velocity = Math.random() * data.maxSpeedAsteroids;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.radius = size / 2;
        // Die Gesundheit ergibt sich aus der Größe, weil je nach Schuss immer ein Teile aus dem Asteroiden heraus gesprengt wird
        this.isActive = true;

        // An Grid anhängen
        //this.assignGrid();

        // Hierauf wird die Textur aus der Perlin Map generiert
        this.cTexture = document.createElement('canvas');
        this.cTexture.width = this.size;
        this.cTexture.height = this.size;
        this.renderTexture({c: this.cTexture});

        // Hierauf wird die Maske gerendert
        this.cMask = document.createElement('canvas');
        this.cMask.width = this.size;
        this.cMask.height = this.size;
        this.renderMask({c: this.cMask});

        // Dies ist das Canvas, auf dem die finale Textur gerendert wird
        this.cRender = document.createElement('canvas');
        this.cRender.width = this.size;
        this.cRender.height = this.size;
        this.renderFull({c: this.cRender})

        data.asteroids.push(this);
    }

    renderTexture({c}) {
        const ctx = c.getContext('2d');
        noise.generatePerlinNoise({
            canvas: c,
            xOffset: this.seed1 % 4096,
            yOffset: this.seed2 % 4096,
            zOffset: this.seed3 % 4096,
            zoom: this.zoom,
            color1: [0, 0, 0],
            color2: [0, 0, 60],
        })

        // Erstelle Displacement Map
        const cDisplacement = document.createElement('canvas');
        cDisplacement.width = c.width;
        cDisplacement.height = c.height;
        this.renderDisplacementMap(cDisplacement);

        // Zeichne mehrere radialGradients in verschiedenen Größen
        const numGradients = helpers.createNumber(20, 40);
        const centerX = c.width / 2;
        const centerY = c.height / 2;

        for (let i = 0; i < numGradients; i++) {
            const radius = helpers.createNumber(c.width / 10, c.width / 4);
            const distance = helpers.createNumber(0, this.maxDistance);
            const angle = Math.random() * Math.PI * 2;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            // Black or white
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
            if (Math.random() > .5) {
                grad.addColorStop(0, `hsla(0, 0%, 100%, 1)`);
                grad.addColorStop(1, 'hsla(0, 0%, 100%, 0)');
            } else {
                grad.addColorStop(0, `hsla(0, 0%, 0%, .5)`);
                grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
            }
            ctx.fillStyle = grad;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillRect(0, 0, c.width, c.height);
        }

        // Wende Displacement auf die Textur an
        this.applyDisplacement(c, cDisplacement, c);
        const softBorder = 10;
        // Kanten aufweichen
        const gradTop = ctx.createLinearGradient(0, 0, 0, softBorder);
        gradTop.addColorStop(0, '#000f');
        gradTop.addColorStop(1, '#0000');
        ctx.fillStyle = gradTop;
        ctx.fillRect(0, 0, c.width, c.height);

        const gradLeft = ctx.createLinearGradient(0, 0, softBorder, 0);
        gradLeft.addColorStop(0, '#000f');
        gradLeft.addColorStop(1, '#0000');
        ctx.fillStyle = gradLeft;
        ctx.fillRect(0, 0, c.width, c.height);

        const gradBottom = ctx.createLinearGradient(0, c.height, 0, c.height - softBorder);
        gradBottom.addColorStop(0, '#000f');
        gradBottom.addColorStop(1, '#0000');
        ctx.fillStyle = gradBottom;
        ctx.fillRect(0, 0, c.width, c.height);

        const gradRight = ctx.createLinearGradient(c.width, 0, c.width - softBorder, 0);
        gradRight.addColorStop(0, '#000f');
        gradRight.addColorStop(1, '#0000');
        ctx.fillStyle = gradRight;
        ctx.fillRect(0, 0, c.width, c.height);

        // Eine feiner aufgelöste Texturmap
        const cDetailed = document.createElement('canvas');
        cDetailed.width = c.width;
        cDetailed.height = c.height;
        noise.generatePerlinNoise({
            canvas: cDetailed,
            xOffset: this.seed1 % 3000,
            yOffset: this.seed2 % 3000,
            zOffset: this.seed3 % 3000,
            zoom: this.zoom / 3,
            color1: [0, 0, 0],
            color2: [0, 0, 50],
        })

        ctx.globalAlpha = 0.5;
        ctx.drawImage(cDetailed, 0, 0);


        ctx.globalAlpha = 1;

        // hier noch eine zweite ebene
        // und ein displacement
    }

    draw() {
        const ctxAsteroids = elements.cAsteroids.getContext('2d');

        const x = this.position.x * elements.cAsteroids.width;
        const y = this.position.y * elements.cAsteroids.height;

        ctxAsteroids.save();
        ctxAsteroids.translate(x, y);
        ctxAsteroids.rotate(this.rotation);
        ctxAsteroids.drawImage(
            // this.cMask,
            this.cRender,
            // this.cTexture,
            -this.size / 2,
            -this.size / 2
        );

        /*
        ctxAsteroids.beginPath();
        ctxAsteroids.arc(0, 0, this.radius, 0, 2 * Math.PI);
        ctxAsteroids.strokeStyle = '#555';
        ctxAsteroids.stroke();
        */

        ctxAsteroids.restore();

    }

    hit(projectile) {

        // console.time(`hit_${count}`);
        let pX = projectile.posX;
        let pY = projectile.posY;

        // Die Differenz sollte erst in Canvas-Pixeln berechnet werden
        const relativeX = pX - (this.position.x * elements.cAsteroids.width);
        const relativeY = pY - (this.position.y * elements.cAsteroids.height);

        // Adjust for the asteroid's rotation
        const angle = -this.rotation;
        const rotatedX = relativeX * Math.cos(angle) - relativeY * Math.sin(angle);
        const rotatedY = relativeX * Math.sin(angle) + relativeY * Math.cos(angle);

        // Calculate the position on the cMask canvas
        const maskX = this.size / 2 + rotatedX;
        const maskY = this.size / 2 + rotatedY;

        // Wenn am Einschlagpunkt kein gefüllter Pixel liegt, abbrechen
        const ctxRender = this.cRender.getContext('2d');
        let pixel = ctxRender.getImageData(maskX, maskY, 1, 1);

        // console.log(pixel.data);
        if (pixel.data[3] < 200) {
            /*
            pixel.data[0] = 255;
            pixel.data[3] = 255;
            ctxRender.putImageData(pixel,maskX, maskY);
             */
            return false;
        }


        // Draw a black circle on the cMask canvas
        ctxRender.globalCompositeOperation = 'destination-out';
        ctxRender.beginPath();
        // ctxRender.arc(maskX, maskY, 10, 0, Math.PI * 2);
        for (let i = 0; i < Math.PI * 2; i += Math.PI / 10) {
            let dist = Math.random() * 10 + 5;
            let x = maskX + Math.cos(i) * dist;
            let y = maskY + Math.sin(i) * dist;
            if (i === 0) {
                ctxRender.moveTo(x, y);
            } else {
                ctxRender.lineTo(x, y);
            }
        }
        ctxRender.fillStyle = 'rgba(0,0,0,255)';
        ctxRender.fill();

        ctxRender.globalCompositeOperation = 'source-over';

        // console.timeEnd(`hit_${count}`);
        count++
        // this.renderFull({c: this.cRender})
        return true;
    }

    update() {
        this.assignGrid();
        // Aktualisiere Rotation
        this.rotation += this.rotationSpeed;

        // Berechne neue Position basierend auf Winkel und Geschwindigkeit
        this.position.x += Math.cos(this.angle) * this.velocity;
        this.position.y += Math.sin(this.angle) * this.velocity;

        // Wrap-around für Bildschirmränder
        let w = this.size / elements.cAsteroids.width;
        let h = this.size / elements.cAsteroids.height;
        if (this.position.x < (0 - w / 2)) this.position.x = (1 + w / 2);
        if (this.position.x > (1 + w / 2)) this.position.x = (0 - w / 2);
        if (this.position.y < (0 - h / 2)) this.position.y = (1 + h / 2);
        if (this.position.y > (1 + h / 2)) this.position.y = (0 - h / 2);
    }

    assignGrid() {
        // Berechnen, in welchem Grid der Asteroid liegt (optimiert)
        let gridX = Math.floor(this.position.x * data.numGrid);
        let gridY = Math.floor(this.position.y * data.numGrid);

        // Clamp in einem Schritt
        gridX = Math.min(Math.max(gridX, 0), data.numGrid - 1);
        gridY = Math.min(Math.max(gridY, 0), data.numGrid - 1);

        // vom bisherigen Grid in neuen Grid verschieben
        if (this.gridX !== gridX || this.gridY !== gridY) {
            let oldGrid = data.grid[this.gridX][this.gridY].asteroids;

            // Schnellerer Remove: splice mit 2. Parameter
            let oldIndex = oldGrid.indexOf(this);
            if (oldIndex !== -1) oldGrid.splice(oldIndex, 1);

            // Gridbox umstellen und Asteroid hier einhängen
            this.gridX = gridX;
            this.gridY = gridY;
            data.grid[gridX][gridY].asteroids.push(this);
        }
    }

    renderDisplacementMap(c) {
        const ctx = c.getContext('2d');
        const imageData = ctx.createImageData(c.width, c.height);
        const data = imageData.data;

        let additionalZoom = .2;

        for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
                const idx = (y * c.width + x) * 4;

                // Rot-Kanal: Erste Perlin-Map für X-Verschiebung
                const perlinX = noise.perlinNoise(
                    (x + this.seed1 % 4096) / this.zoom * additionalZoom,
                    (y + this.seed2 % 4096) / this.zoom * additionalZoom,
                    (this.seed3 % 4096) / this.zoom * additionalZoom
                );
                data[idx] = (perlinX * 0.5 + 0.5) * 255; // Normalisiere auf 0-255

                // Grün-Kanal: Zweite Perlin-Map für Y-Verschiebung
                const perlinY = noise.perlinNoise(
                    (x + (this.seed1 * 2.3) % 4096) / this.zoom * additionalZoom,
                    (y + (this.seed2 * 1.9) % 4096) / this.zoom * additionalZoom,
                    ((this.seed3 * 1.5) % 4096) / this.zoom * additionalZoom
                );
                data[idx + 1] = (perlinY * 0.5 + 0.5) * 255; // Normalisiere auf 0-255

                // Blau-Kanal auf 0
                data[idx + 2] = 0;

                // Alpha-Kanal auf 255 (voll opak)
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    renderMask({c}) {
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(
            c.width / 2, c.height / 2, this.maxDistance,
            c.height / 2, c.width / 2, c.height / 10,
        )
        grad.addColorStop(0, '#000');
        grad.addColorStop(1, '#aaa');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, c.width, c.height);


    }

    removeIslands(c) {
        const ctx = c.getContext('2d');
        const imgData = ctx.getImageData(0, 0, c.width, c.height);

        const cIsland = document.createElement('canvas');
        cIsland.width = c.width;
        cIsland.height = c.height;
        const ctxIsland = cIsland.getContext('2d');

        ctxIsland.fillStyle = '#0000';
        ctx.fillRect(0, 0, cIsland.width, cIsland.height);
        const imgDataIsland = ctxIsland.getImageData(0, 0, cIsland.width, cIsland.height);

        const checkNeighbors = (x, y) => {
            const idx = y * cIsland.width + x;
            const i = idx * 4;

            // Bereits besuchter Pixel
            if (imgDataIsland.data[i + 3] != 0) return false;


            // Pixel innerhalb des Canvas
            if (x < 0
                || x >= cIsland.width
                || y < 0
                || y >= cIsland.height
            ) return false;

            if (imgData.data[i] > this.outlineMinValue) {
                imgDataIsland.data[i] = 255;
                imgDataIsland.data[i + 1] = 255;
                imgDataIsland.data[i + 2] = 255;
                // Alpha, um checken zu können, ob dieser Pixel bereits besucht wurde
                imgDataIsland.data[i + 3] = 255;
            } else {
                imgDataIsland.data[i] = 0;
                imgDataIsland.data[i + 1] = 0;
                imgDataIsland.data[i + 2] = 0;
                // Alpha, um checken zu können, ob dieser Pixel bereits besucht wurde
                imgDataIsland.data[i + 3] = 255;

                // Schwarze Pixel nicht weiter verfolgen
                return false;
            }

            checkNeighbors(x - 1, y);
            checkNeighbors(x + 1, y);
            checkNeighbors(x, y - 1);
            checkNeighbors(x, y + 1);

            checkNeighbors(x + 1, y + 1);
            checkNeighbors(x + 1, y - 1);
            checkNeighbors(x - 1, y + 1);
            checkNeighbors(x - 1, y - 1);
        }

        // Maske erzeugung starten
        checkNeighbors(Math.round(c.width / 2), Math.round(c.height / 2));

        // Maske anwenden
        for (let i = 0; i < imgData.data.length; i += 4) {
            let value = imgDataIsland.data[i] == 0 ? 0 : imgData.data[i];
            imgData.data[i] = value;
            imgData.data[i + 1] = value;
            imgData.data[i + 2] = value;
            imgData.data[i + 3] = imgDataIsland.data[i + 3];
        }

        ctx.putImageData(imgData, 0, 0);
        // ctx.putImageData(imgDataIsland, 0, 0);
    }

    renderFull({c}) {
        const ctx = c.getContext('2d');

        // Draw the texture
        ctx.drawImage(this.cTexture, 0, 0);

        // Add the mask
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(this.cMask, 0, 0);

        // Invert the mask
        const ctxMask = this.cMask.getContext('2d');
        ctxMask.globalCompositeOperation = 'difference';
        ctxMask.fillStyle = '#fff';
        ctxMask.fillRect(0, 0, this.cMask.width, this.cMask.height);

        // Subtract 128 from each pixel to darken
        let imageData = ctx.getImageData(0, 0, c.width, c.height);
        let data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Abdunkeln
            data[i] = Math.max(0, data[i] - 128) * 2;     // R
            data[i + 1] = Math.max(0, data[i + 1] - 128) * 2; // G
            data[i + 2] = Math.max(0, data[i + 2] - 128) * 2; // B
        }
        ctx.putImageData(imageData, 0, 0);

        this.removeIslands(c);

        imageData = ctx.getImageData(0, 0, c.width, c.height);
        data = imageData.data;
        // Outline zeichnen

        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < this.outlineMinValue) {
                data[i + 3] = 0;
            } else if (data[i] >= this.outlineMinValue && data[i] <= this.outlineMaxValue) {
                data[i + 0] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
            } else {
                data[i + 0] = 20;
                data[i + 1] = 20;
                data[i + 2] = 20;
            }
        }

        // Invert the mask  back
        ctxMask.globalCompositeOperation = 'difference';
        ctxMask.fillStyle = '#fff';
        ctxMask.fillRect(0, 0, this.cMask.width, this.cMask.height);

        // Reset blend mode
        ctx.globalCompositeOperation = 'source-over';
    }

    applyDisplacement(sourceCanvas, displacementCanvas, targetCanvas) {
        const sourceCtx = sourceCanvas.getContext('2d');
        const displacementCtx = displacementCanvas.getContext('2d');
        const targetCtx = targetCanvas.getContext('2d');

        const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const displacementData = displacementCtx.getImageData(0, 0, displacementCanvas.width, displacementCanvas.height);
        const targetData = targetCtx.createImageData(targetCanvas.width, targetCanvas.height);

        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        const dispStr = this.displacementStrength; // Stärke der Verzerrung

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                // Lese Displacement-Werte aus Rot- und Grün-Kanal
                const displaceX = (displacementData.data[idx] / 255 - 0.5) * dispStr;
                const displaceY = (displacementData.data[idx + 1] / 255 - 0.5) * dispStr;

                // Berechne neue Position
                let newX = Math.round(x + displaceX);
                let newY = Math.round(y + displaceY);

                // Clamp zu gültigen Koordinaten
                newX = Math.max(0, Math.min(width - 1, newX));
                newY = Math.max(0, Math.min(height - 1, newY));

                const newIdx = (newY * width + newX) * 4;

                // Kopiere Pixel vom verschobenen Ort
                targetData.data[idx] = sourceData.data[newIdx];
                targetData.data[idx + 1] = sourceData.data[newIdx + 1];
                targetData.data[idx + 2] = sourceData.data[newIdx + 2];
                targetData.data[idx + 3] = sourceData.data[newIdx + 3];
            }
        }

        targetCtx.putImageData(targetData, 0, 0);
    }

}

export default Asteroid;