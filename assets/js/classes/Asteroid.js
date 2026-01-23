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
                    splitThreshold = .2,
                    minFragmentPixels = 200,
                    thresholdAsteroidByHit = .2,
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
            gridY,
            splitThreshold,
            minFragmentPixels,
            thresholdAsteroidByHit
        });
        this.maxDistance = this.size / 2 * .7;
        this.id = id ? id : helpers.createID();
        this.position = {x: Math.random(), y: Math.random()};
        this.velocity = Math.random() * (data.maxSpeedAsteroids / 2);
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

    draw() {
        const ctxAsteroids = elements.cAsteroids.getContext('2d');

        let x = this.position.x;
        let y = this.position.y;

        ctxAsteroids.save();
        x -= data.ship.position.x;
        y -= data.ship.position.y;

        x = (x + 1) % 1;
        y = (y + 1) % 1;

        x *= elements.cAsteroids.width;
        y *= elements.cAsteroids.height;

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
        console.log(projectile);

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
            return false;
        }

        // Zeichne den Einschlag bzw die geschlagene KLücke
        ctxRender.beginPath();
        // ctxRender.arc(maskX, maskY, 10, 0, Math.PI * 2);
        for (let i = 0; i < Math.PI * 2; i += Math.PI / 6) {

            let dist = Math.random() * projectile.punch + (projectile.punch / 2);
            let x = maskX + Math.cos(i) * dist;
            let y = maskY + Math.sin(i) * dist;
            if (i === 0) {
                ctxRender.moveTo(x, y);
            } else {
                ctxRender.lineTo(x, y);
            }
        }

        ctxRender.fillStyle = 'rgba(0,0,0,255)';
        ctxRender.globalCompositeOperation = 'destination-out';
        ctxRender.fill();


        ctxRender.globalCompositeOperation = 'source-over';

        // impulse übertragen
        // impulse übertragen
        // 1. Projektilimpuls in Vektorkomponenten zerlegen
        const projectileVelocityX = Math.cos(projectile.direction) * projectile.speed;
        const projectileVelocityY = Math.sin(projectile.direction) * projectile.speed;
        const projectileMomentumX = projectileVelocityX * projectile.impulse;
        const projectileMomentumY = projectileVelocityY * projectile.impulse;

        // 2. Aktuelle Asteroidengeschwindigkeit in Vektorkomponenten
        const asteroidVelocityX = Math.cos(this.angle) * this.velocity;
        const asteroidVelocityY = Math.sin(this.angle) * this.velocity;

        // 3. Impulsübertragung (addiere die Impulse)
        const newVelocityX = asteroidVelocityX + projectileMomentumX;
        const newVelocityY = asteroidVelocityY + projectileMomentumY;

        // 4. Neue Geschwindigkeit und Richtung berechnen
        this.velocity = Math.sqrt(newVelocityX * newVelocityX + newVelocityY * newVelocityY);
        this.angle = Math.atan2(newVelocityY, newVelocityX);

        // Optional: Maximale Geschwindigkeit begrenzen
        if (this.velocity > data.maxSpeedAsteroids * 2) {
            this.velocity = data.maxSpeedAsteroids * 2;
        }

        // 5. Rotation durch Drehmoment beeinflussen
        // Berechne den Vektor vom Asteroidenzentrum zum Einschlagpunkt
        const asteroidCenterX = this.position.x * elements.cAsteroids.width;
        const asteroidCenterY = this.position.y * elements.cAsteroids.height;
        const impactVectorX = projectile.posX - asteroidCenterX;
        const impactVectorY = projectile.posY - asteroidCenterY;

        // Berechne das Kreuzprodukt (z-Komponente) für das Drehmoment
        // Kreuzprodukt: impactVector × projectileMomentum
        const torque = (impactVectorX * projectileMomentumY - impactVectorY * projectileMomentumX);

        // Normalisiere das Drehmoment basierend auf der Größe des Asteroiden
        // Kleinere Asteroiden drehen sich stärker, größere weniger
        const angularImpulse = torque / (this.size * this.size);

        // Addiere zur Rotationsgeschwindigkeit
        this.rotationSpeed += angularImpulse * 0.1; // Skalierungsfaktor für Spielgefühl

        // Optional: Maximale Rotationsgeschwindigkeit begrenzen
        const maxRotationSpeed = 0.1;
        if (Math.abs(this.rotationSpeed) > maxRotationSpeed) {
            this.rotationSpeed = Math.sign(this.rotationSpeed) * maxRotationSpeed;
        }

        // Debris erzeugen
        let numDebris = helpers.createNumber(3, 6);
        for (let i = 0; i < numDebris; i++) {
            new Debris({
                x: projectile.posX,
                y: projectile.posY,
                size: helpers.createNumber(3, 10),
            })
        }

        // Abgetrennte Teile als neue Asteroiden erstellen
        const newFragments = this.splitAsteroid(projectile, maskX, maskY);

        // Prüfe ob mindestens ein Fragment groß genug ist
        const largeEnoughFragment = this.countSolidPixels(this.cRender) > this.minFragmentPixels * 3

        if (largeEnoughFragment && Math.random() < this.thresholdAsteroidByHit) {
            // if (Math.random() < this.thresholdAsteroidByHit) {
            // Erstelle einen kleinen Asteroiden am Einschlagpunkt
            const fragmentSize = helpers.createNumber(30, 60);

            const newFragment = new Asteroid({
                size: fragmentSize,
                zoom: this.zoom,
                outlineMinValue: this.outlineMinValue,
                outlineMaxValue: this.outlineMaxValue,
                displacementStrength: this.displacementStrength,
            });

            // Position: Konvertiere maskX/maskY (lokale Canvas-Coords) in Weltkoordinaten
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);
            const localX = maskX - this.cRender.width / 2;
            const localY = maskY - this.cRender.height / 2;
            const rotatedX = localX * cos - localY * sin;
            const rotatedY = localX * sin + localY * cos;

            newFragment.position.x = this.position.x + (rotatedX / elements.cAsteroids.width);
            newFragment.position.y = this.position.y + (rotatedY / elements.cAsteroids.height);

            /*
                        // Bewegung: Kombination aus Original-Asteroid und Projektil-Richtung
                        const projectileInfluence = 0.1;
                        const asteroidVelX = Math.cos(this.angle) * this.velocity;
                        const asteroidVelY = Math.sin(this.angle) * this.velocity;
                        const projectileVelX = Math.cos(projectile.direction) * projectile.speed * 0.5;
                        const projectileVelY = Math.sin(projectile.direction) * projectile.speed * 0.5;
                        const newVelX = asteroidVelX * (1 - projectileInfluence) + projectileVelX * projectileInfluence;
                        const newVelY = asteroidVelY * (1 - projectileInfluence) + projectileVelY * projectileInfluence;

                        newFragment.velocity = Math.sqrt(newVelX * newVelX + newVelY * newVelY) * (0.8 + Math.random() * 0.4);
                        newFragment.angle = Math.atan2(newVelY, newVelX) + (Math.random() - 0.5) * 0.8;
                        newFragment.rotationSpeed = (Math.random() - 0.5) * 0.05;
              */
            // Ersetze die Zeilen für Bewegung (ca. Zeile 250-261) mit:
            // Bewegung: Hauptsächlich entgegen der Projektilrichtung mit viel Zufälligkeit
            const oppositeDirection = projectile.direction + Math.PI; // 180° gedreht
            const randomDeviation = (Math.random() - 0.5) * Math.PI; // Bis zu ±90° Abweichung

            newFragment.angle = oppositeDirection + randomDeviation;
            newFragment.velocity = this.velocity * (0.5 + Math.random() * 0.8); // 50-130% der Original-Geschwindigkeit
            newFragment.rotationSpeed = (Math.random() - 0.5) * 0.05;

            // Grid zuweisen
            data.asteroids.unshift(newFragment);

            newFragment.assignGrid();
        }

        count++
        return true;
    }

    // Hilfsfunktion: Zähle nicht-transparente Pixel
    countSolidPixels(canvas) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let count = 0;

        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 200) {
                count++;
            }
        }

        return count;
    }

    splitAsteroid(projectile, maskX, maskY) {
        const ctxRender = this.cRender.getContext('2d');
        const imageData = ctxRender.getImageData(0, 0, this.cRender.width, this.cRender.height);
        const pixelData = imageData.data;

        // 1. Scanline entlang der Projektil-Richtung vom Einschlagpunkt
        const dirX = Math.cos(projectile.direction);
        const dirY = Math.sin(projectile.direction);

        let solidPixelCount = 0;
        const maxScanDistance = Math.max(this.cRender.width, this.cRender.height);

        for (let dist = -maxScanDistance; dist < maxScanDistance; dist++) {
            const scanX = Math.round(maskX + dirX * dist);
            const scanY = Math.round(maskY + dirY * dist);

            if (scanX < 0 || scanX >= this.cRender.width ||
                scanY < 0 || scanY >= this.cRender.height) {
                continue;
            }

            const idx = (scanY * this.cRender.width + scanX) * 4;
            if (pixelData[idx + 3] > 200) {
                solidPixelCount++;
            }
        }

        // 2. Threshold prüfen
        const threshold = this.size * 0.15;

        if (solidPixelCount > threshold) {
            return [];
        }

        // 3. Asteroid teilen
        const perpX = -dirY;
        const perpY = dirX;

        const canvas1 = document.createElement('canvas');
        canvas1.width = this.cRender.width;
        canvas1.height = this.cRender.height;
        const ctx1 = canvas1.getContext('2d');
        const imageData1 = ctx1.createImageData(canvas1.width, canvas1.height);
        const data1 = imageData1.data;

        const canvas2 = document.createElement('canvas');
        canvas2.width = this.cRender.width;
        canvas2.height = this.cRender.height;
        const ctx2 = canvas2.getContext('2d');
        const imageData2 = ctx2.createImageData(canvas2.width, canvas2.height);
        const data2 = imageData2.data;

        for (let y = 0; y < this.cRender.height; y++) {
            for (let x = 0; x < this.cRender.width; x++) {
                const idx = (y * this.cRender.width + x) * 4;

                if (pixelData[idx + 3] < 50) continue;

                const dx = x - maskX;
                const dy = y - maskY;
                const side = dx * perpX + dy * perpY;

                if (side < 0) {
                    data1[idx] = pixelData[idx];
                    data1[idx + 1] = pixelData[idx + 1];
                    data1[idx + 2] = pixelData[idx + 2];
                    data1[idx + 3] = pixelData[idx + 3];
                } else {
                    data2[idx] = pixelData[idx];
                    data2[idx + 1] = pixelData[idx + 1];
                    data2[idx + 2] = pixelData[idx + 2];
                    data2[idx + 3] = pixelData[idx + 3];
                }
            }
        }

        ctx1.putImageData(imageData1, 0, 0);
        ctx2.putImageData(imageData2, 0, 0);

        // Hilfsfunktion: Erzeuge Debris aus Fragment
        const createDebrisFromFragment = (canvas) => {
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const fragmentData = imgData.data;
            const debrisCount = helpers.createNumber(8, 15);

            for (let i = 0; i < debrisCount; i++) {
                let foundPixel = false;
                let attempts = 0;

                while (!foundPixel && attempts < 50) {
                    const randX = Math.floor(Math.random() * canvas.width);
                    const randY = Math.floor(Math.random() * canvas.height);
                    const idx = (randY * canvas.width + randX) * 4;

                    if (fragmentData[idx + 3] > 200) {
                        const cos = Math.cos(this.rotation);
                        const sin = Math.sin(this.rotation);
                        const localX = randX - canvas.width / 2;
                        const localY = randY - canvas.height / 2;
                        const rotatedX = localX * cos - localY * sin;
                        const rotatedY = localX * sin + localY * cos;

                        const worldX = (this.position.x * elements.cAsteroids.width) + rotatedX;
                        const worldY = (this.position.y * elements.cAsteroids.height) + rotatedY;

                        new Debris({
                            x: worldX,
                            y: worldY,
                            size: helpers.createNumber(2, 8),
                        });

                        foundPixel = true;
                    }
                    attempts++;
                }
            }
        };

        // Prüfe beide Fragmente einzeln
        const minFragmentPixels = 500;
        const canvas1PixelCount = this.countSolidPixels(canvas1);
        const canvas2PixelCount = this.countSolidPixels(canvas2);

        const newAsteroids = [];

        // Fragment 1 verarbeiten
        if (canvas1PixelCount < minFragmentPixels) {
            // Zu klein: Erzeuge Debris
            createDebrisFromFragment(canvas1);
        } else {
            // Groß genug: Erstelle Asteroiden
            const newAsteroid = Object.create(Object.getPrototypeOf(this));

            newAsteroid.seed1 = this.seed1;
            newAsteroid.seed2 = this.seed2;
            newAsteroid.seed3 = this.seed3;
            newAsteroid.zoom = this.zoom;
            newAsteroid.outlineMinValue = this.outlineMinValue;
            newAsteroid.outlineMaxValue = this.outlineMaxValue;
            newAsteroid.displacementStrength = this.displacementStrength;
            newAsteroid.id = helpers.createID();
            newAsteroid.isActive = true;

            newAsteroid.size = this.size;
            newAsteroid.radius = this.radius;
            newAsteroid.maxDistance = this.maxDistance;

            newAsteroid.cRender = canvas1;
            newAsteroid.cTexture = document.createElement('canvas');
            newAsteroid.cTexture.width = this.size;
            newAsteroid.cTexture.height = this.size;
            newAsteroid.cMask = document.createElement('canvas');
            newAsteroid.cMask.width = this.size;
            newAsteroid.cMask.height = this.size;

            newAsteroid.position = {
                x: this.position.x,
                y: this.position.y
            };

            const spreadSpeed = 0.0005;
            const perpAngle = Math.atan2(perpY, perpX);
            const velX = Math.cos(this.angle) * this.velocity;
            const velY = Math.sin(this.angle) * this.velocity;
            const spreadX = Math.cos(perpAngle) * spreadSpeed * -1;
            const spreadY = Math.sin(perpAngle) * spreadSpeed * -1;

            const newVelX = velX + spreadX;
            const newVelY = velY + spreadY;
            newAsteroid.velocity = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
            newAsteroid.angle = Math.atan2(newVelY, newVelX);
            newAsteroid.rotation = this.rotation + (Math.random() - 0.5) * 0.3;
            newAsteroid.rotationSpeed = this.rotationSpeed * (0.8 + Math.random() * 0.4);

            newAsteroid.gridX = this.gridX;
            newAsteroid.gridY = this.gridY;

            data.asteroids.push(newAsteroid);
            data.grid[newAsteroid.gridX][newAsteroid.gridY].asteroids.push(newAsteroid);

            newAsteroids.push(newAsteroid);
        }

        // Fragment 2 verarbeiten
        if (canvas2PixelCount < minFragmentPixels) {
            // Zu klein: Erzeuge Debris
            createDebrisFromFragment(canvas2);
        } else {
            // Groß genug: Erstelle Asteroiden
            const newAsteroid = Object.create(Object.getPrototypeOf(this));

            newAsteroid.seed1 = this.seed1;
            newAsteroid.seed2 = this.seed2;
            newAsteroid.seed3 = this.seed3;
            newAsteroid.zoom = this.zoom;
            newAsteroid.outlineMinValue = this.outlineMinValue;
            newAsteroid.outlineMaxValue = this.outlineMaxValue;
            newAsteroid.displacementStrength = this.displacementStrength;
            newAsteroid.id = helpers.createID();
            newAsteroid.isActive = true;

            newAsteroid.size = this.size;
            newAsteroid.radius = this.radius;
            newAsteroid.maxDistance = this.maxDistance;

            newAsteroid.cRender = canvas2;
            newAsteroid.cTexture = document.createElement('canvas');
            newAsteroid.cTexture.width = this.size;
            newAsteroid.cTexture.height = this.size;
            newAsteroid.cMask = document.createElement('canvas');
            newAsteroid.cMask.width = this.size;
            newAsteroid.cMask.height = this.size;

            newAsteroid.position = {
                x: this.position.x,
                y: this.position.y
            };

            const spreadSpeed = 0.0005;
            const perpAngle = Math.atan2(perpY, perpX);
            const velX = Math.cos(this.angle) * this.velocity;
            const velY = Math.sin(this.angle) * this.velocity;
            const spreadX = Math.cos(perpAngle) * spreadSpeed * 1;
            const spreadY = Math.sin(perpAngle) * spreadSpeed * 1;

            const newVelX = velX + spreadX;
            const newVelY = velY + spreadY;
            newAsteroid.velocity = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
            newAsteroid.angle = Math.atan2(newVelY, newVelX);
            newAsteroid.rotation = this.rotation + (Math.random() - 0.5) * 0.3;
            newAsteroid.rotationSpeed = this.rotationSpeed * (0.8 + Math.random() * 0.4);

            newAsteroid.gridX = this.gridX;
            newAsteroid.gridY = this.gridY;

            data.asteroids.push(newAsteroid);
            data.grid[newAsteroid.gridX][newAsteroid.gridY].asteroids.push(newAsteroid);

            newAsteroids.push(newAsteroid);
        }

        // Original-Asteroid entfernen
        const asteroidIndex = data.asteroids.indexOf(this);
        if (asteroidIndex > -1) {
            data.asteroids.splice(asteroidIndex, 1);
        }

        const gridAsteroids = data.grid[this.gridX][this.gridY].asteroids;
        const gridIndex = gridAsteroids.indexOf(this);
        if (gridIndex > -1) {
            gridAsteroids.splice(gridIndex, 1);
        }

        this.isActive = false;

        return newAsteroids;
    }

    update() {
        this.assignGrid();
        // Aktualisiere Rotation
        this.rotation += this.rotationSpeed;

        // Berechne neue Position basierend auf Winkel und Geschwindigkeit
        this.position.x += Math.cos(this.angle) * this.velocity;
        this.position.y += Math.sin(this.angle) * this.velocity;

        // Wrap-around für Bildschirmränder
        let sp = data.ship.position;
        let w = this.size / elements.cAsteroids.width;
        let h = this.size / elements.cAsteroids.height;

        this.position.x = (this.position.x + 1) % 1;
        this.position.y = (this.position.y + 1) % 1;
        /*
        if (this.position.x < (0 - w / 2)) this.position.x = (1 + w / 2);
        if (this.position.x > (1 + w / 2)) this.position.x = (0 - w / 2);
        if (this.position.y < (0 - h / 2)) this.position.y = (1 + h / 2);
        if (this.position.y > (1 + h / 2)) this.position.y = (0 - h / 2);
        */
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
        const imageDataTexture = this.cTexture.getContext('2d').getImageData(0, 0, c.width, c.height);

        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i + 0] = imageData.data[i + 0] * (imageDataTexture.data[i + 0] / 255) + .25;
            imageData.data[i + 1] = imageData.data[i + 1] * (imageDataTexture.data[i + 1] / 255) + .2;
            imageData.data[i + 2] = imageData.data[i + 2] * (imageDataTexture.data[i + 2] / 255) + .2;
        }
        ctx.putImageData(imageData, 0, 0);

        // Invert the mask back
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