
'use strict';

const noise = {
    permutation: new Array(512),
    init() {
        const permutation = this.permutation;

        // Create a permutation array of 512 elements
        for (let i = 0; i < 256; i++) {
            permutation[i] = i;
        }

        // Shuffle the permutation array
        for (let i = 0; i < 256; i++) {
            const j = Math.floor(Math.random() * 256);
            [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
        }

        // Duplicate the permutation array to avoid overflow
        for (let i = 0; i < 256; i++) {
            permutation[256 + i] = permutation[i];
        }

        // Store the permutation array in the noise object
        this.permutation = permutation;
    },
    generatePerlinNoise({
        canvas,
        xOffset = 0,
        yOffset = 0,
        zOffset = 0,
        zoom = 1,
        color1 = [0, 0, 0],
        color2 = [0, 0, 100]
    } = {}) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Calculate the Perlin noise value at the current position with zoom applied
                const noiseValue = this.perlinNoise((x + xOffset) / zoom, (y + yOffset) / zoom, zOffset);

                // Map the noise value from [-1, 1] to [0, 1]
                const normalizedValue = (noiseValue + 1) / 2;

                // Interpolate between color1 and color2 in HSL space
                const h = color1[0] + (color2[0] - color1[0]) * normalizedValue;
                const s = color1[1] + (color2[1] - color1[1]) * normalizedValue;
                const l = color1[2] + (color2[2] - color1[2]) * normalizedValue;

                // Convert HSL to RGB
                const rgb = this.hslToRgb(h, s, l);

                // Set the pixel color
                const index = (y * width + x) * 4;
                data[index] = rgb[0];     // R
                data[index + 1] = rgb[1]; // G
                data[index + 2] = rgb[2]; // B
                data[index + 3] = 255;     // A
            }
        }

        // Draw the image data to the canvas
        ctx.putImageData(imageData, 0, 0);
    },

    perlinNoise(x, y, z, zoom) {
        // Find the unit cube that contains the point
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        // Find relative x, y, z of point in cube
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        // Compute fade curves for each of x, y, z
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        // Hash coordinates of the 8 cube corners
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A] + Z;
        const AB = this.permutation[A + 1] + Z;
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B] + Z;
        const BB = this.permutation[B + 1] + Z;

        // Add blended results from 8 corners of cube
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.permutation[AA], x, y, z),
                    this.grad(this.permutation[BA], x - 1, y, z)),
                this.lerp(u, this.grad(this.permutation[AB], x, y - 1, z),
                    this.grad(this.permutation[BB], x - 1, y - 1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.permutation[AA + 1], x, y, z - 1),
                    this.grad(this.permutation[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
                    this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))));
    },

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    },

    lerp(t, a, b) {
        return a + t * (b - a);
    },

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    },

    hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}

export default noise;