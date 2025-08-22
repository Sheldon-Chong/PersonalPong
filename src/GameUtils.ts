export enum BlendMode {
    SourceOver = "source-over",
    SourceIn = "source-in",
    SourceOut = "source-out",
    SourceAtop = "source-atop",
    DestinationOver = "destination-over",
    DestinationIn = "destination-in",
    DestinationOut = "destination-out",
    DestinationAtop = "destination-atop",
    Lighter = "lighter",
    Copy = "copy",
    Xor = "xor",
    Multiply = "multiply",
    Screen = "screen",
    Overlay = "overlay",
    Darken = "darken",
    Lighten = "lighten",
    ColorDodge = "color-dodge",
    ColorBurn = "color-burn",
    HardLight = "hard-light",
    SoftLight = "soft-light",
    Difference = "difference",
    Exclusion = "exclusion",
    Hue = "hue",
    Saturation = "saturation",  
    Color = "color",
    Luminosity = "luminosity"
}

// Shift the hue of an image by a specified value (in degrees)
export function shiftImageHue(img: HTMLImageElement, hueShift: number): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Convert RGB to HSL
        let r = data[i] / 255;
        let g = data[i + 1] / 255;
        let b = data[i + 2] / 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        // Shift hue
        h = (h + hueShift / 360) % 1;
        // Convert HSL back to RGB
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        function hue2rgb(p: number, q: number, t: number) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        data[i] = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
        data[i + 1] = Math.round(hue2rgb(p, q, h) * 255);
        data[i + 2] = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
        // Alpha remains unchanged
    }
    ctx.putImageData(imageData, 0, 0);
    const newImg = new Image();
    newImg.src = canvas.toDataURL();
    return newImg;
}

import { Point2D, Vector2D } from './Coordinates'
import type { PongGame } from './pong';

export class Glow {
    constructor(
        public shadowColor: string = "red",
        public shadowBlur: number = 20,
        public shadowOffsetX: number = 0,
        public shadowOffsetY: number = 0,
        public blendMode: GlobalCompositeOperation = "source-over"
    ) {}
}


export class GameObject {
    collisions: GameObject[] = [];
    children: GameObject[] = [];

    constructor(
        public position: Point2D,
        public game: PongGame,
        public parent: GameObject | null = null,
        public name: string = "",
        public velocity: Vector2D = new Vector2D(0, 0),
        public acceleration: Vector2D = new Vector2D(0, 0),
        public maximumVelocity: Vector2D = new Vector2D(1000, 1000),
        public size: Vector2D = new Vector2D(0, 0),
        public sprite?: Sprite,
        public hitbox?: HitBox | null,
        protected ctx: CanvasRenderingContext2D = game.ctx,
        public onCollide?: (other: GameObject) => boolean,
        public onUpdate?: () => boolean
    ) {
        // Object.assign(this, );
    }

    addChild(object: GameObject) {
        this.children.push(object);
        object.parent = this;
    }

    Draw() {
        if (this.sprite === undefined)
            return;
        const pos = this.getWorldPosition().subtract(this.sprite.size.divide(new Vector2D(2, 2)));

        this.sprite!.drawImg(this.ctx, pos.add(this.sprite!.pos.toVector2D()), this.sprite.size, this.sprite.rotation);
    }

    previewHitbox() {
        if (!this.hitbox || !this.hitbox.size) return;
        const x = this.position.x - this.hitbox.size.x / 2;
        const y = this.position.y - this.hitbox.size.y / 2;
        this.ctx.save();
        this.ctx.strokeStyle = "blue";
        this.ctx.strokeRect(x, y, this.hitbox.size.x, this.hitbox.size.y);
        this.ctx.restore();
    }

    getWorldPosition(): Point2D {
        if (!this.parent) {
            return new Point2D(
                this.position.x - this.game.camera.position.x,
                this.position.y - this.game.camera.position.y
            ).add(this.game.canvasSize.divide(new Vector2D(2,2)));
        }
        const parentPos = this.parent.getWorldPosition();
        return new Point2D(
            parentPos.x + this.position.x,
            parentPos.y + this.position.y
        );
    }

    update(delta) {
        this.velocity.x += this.acceleration.x * delta;
        this.velocity.y += this.acceleration.y * delta;

        // Clamp velocity to maximumVelocity if defined
        if (this.maximumVelocity) {
            this.velocity.x = Math.max(
                -Math.abs(this.maximumVelocity.x),
                Math.min(this.velocity.x, Math.abs(this.maximumVelocity.x))
            );

            this.velocity.y = Math.max(
                -Math.abs(this.maximumVelocity.y),
                Math.min(this.velocity.y, Math.abs(this.maximumVelocity.y))
            );
        }

        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;

        this.collisions = [];
        if (this.hitbox !== undefined) {
            for (const obj of this.game.gameObjects) {
                if (
                    obj !== this &&
                    this.hitbox !== null &&
                    obj.hitbox !== undefined &&
                    obj.hitbox !== null &&
                    this.hitbox.isCollidingWith(obj.hitbox)
                ) {
                    this.collisions.push(obj);
                    if (this.onCollide) {
                        this.onCollide(obj);
                    }
                }
            }
        }
        if (this.onUpdate !== undefined) {
            this.onUpdate();
        }
    }
}

export function createColoredImage(color: string, size: Vector2D): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = size.x;
    canvas.height = size.y;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size.x, size.y);
    }
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
}


export class Particle {
    createdAt: number;
    constructor(
        public game: PongGame,
        public lifespanMs: number, // lifespan in milliseconds
        public sprite: Sprite,
        public position: Point2D,
        public onUpdate: (instance: Particle) => void,
        public direction = 0,
        public speed = 0
    ) {
        this.createdAt = performance.now();
    }

    draw() {
        let pos = new Point2D(
                this.position.x - this.game.camera.position.x,
                this.position.y - this.game.camera.position.y
            ).add(this.game.canvasSize.divide(new Vector2D(2,2)));
        pos = pos.subtract(this.sprite.size.divide(new Vector2D(2, 2)));
        this.sprite.drawImg(this.game.ctx, pos.add(this.sprite.pos.toVector2D()), this.sprite.size, 0);
    }

    update() {
        if (this.onUpdate) this.onUpdate(this);
        // ...other update logic...
    }

    isAlive(): boolean {
        return (performance.now() - this.createdAt) < this.lifespanMs;
    }
}

export class Timer extends GameObject{
    private startTime: number;
    private duration: number;
    private callback: () => void;
    private triggered: boolean = false;

    constructor(game: PongGame, durationSeconds: number, callback: () => void) {
        super(new Point2D(0,0), game);
        this.startTime = performance.now();
        this.duration = durationSeconds * 1000;
        this.callback = callback;
    }

    update() {
        if (!this.triggered && (performance.now() - this.startTime) >= this.duration) {
            this.triggered = true;
            this.callback();
        }
    }
}

export class Sprite {
    image: HTMLImageElement;

    imagePath: string | HTMLImageElement | null = null;
    size: Vector2D = new Vector2D(0, 0);
    rotation: number = 0;
    flippedHorizontal: boolean = false;
    crop: boolean = false;
    outline: boolean = false;
    opacity: number = 1.0;
    blendMode: GlobalCompositeOperation = "source-over";
    glow: Glow| null = null;
    pos: Point2D = new Point2D(0,0);

    constructor(params: Partial<Sprite> = {}) {
        Object.assign(this, params);
        const diameter = Math.max(this.size.x, this.size.y);
        const canvas = document.createElement('canvas');
        canvas.width = diameter;
        canvas.height = diameter;
        const ctx = canvas.getContext('2d');
        this.image = new Image();

        if (this.imagePath instanceof HTMLImageElement) 
            this.image = this.imagePath;
        
        else if (ctx) {
            ctx.save();
            if (this.crop) {
                ctx.beginPath();
                ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
            }
            let img = new Image();
            if (this.imagePath) 
                img.src = this.imagePath;
            
            else 
                img.src = createColoredImage("#ffffff", this.size).src;
            
            img.onload = () => {
                ctx.drawImage(img, 0, 0, diameter, diameter);
                this.image.src = canvas.toDataURL();
            };
            // Set a placeholder until loaded
            this.image.src = canvas.toDataURL();
        }

        this.opacity = this.opacity;
        if (this.size.x === 0 && this.size.y === 0) {
            this.size = new Vector2D(this.image.width, this.image.height);
        }
    }

    drawImg(
        ctx: CanvasRenderingContext2D,
        pos: Point2D,
        size: Vector2D,
        angle: number,
    ) {
        // Draw glow pass
        if (this.glow) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.globalCompositeOperation = this.glow.blendMode;
            ctx.translate(pos.x + size.x / 2, pos.y + size.y / 2);
            ctx.rotate(angle);
            ctx.shadowColor = this.glow.shadowColor;
            ctx.shadowBlur = this.glow.shadowBlur;
            ctx.shadowOffsetX = this.glow.shadowOffsetX;
            ctx.shadowOffsetY = this.glow.shadowOffsetY;
            if (this.flippedHorizontal) ctx.scale(-1, 1);
            ctx.drawImage(this.image, -size.x / 2, -size.y / 2, size.x, size.y);
            ctx.restore();
        }

        // Draw sprite pass
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.globalCompositeOperation = this.blendMode;
        ctx.translate(pos.x + size.x / 2, pos.y + size.y / 2);
        ctx.rotate(angle);
        if (this.flippedHorizontal) ctx.scale(-1, 1);

        if (this.outline) {
            ctx.beginPath();
            const diameter = Math.max(size.x, size.y);
            ctx.arc(0, 0, diameter / 2, 0, Math.PI * 2);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.drawImage(this.image, -size.x / 2, -size.y / 2, size.x, size.y);
        ctx.restore();
    }

    clone(): Sprite {
        // Deep copy the image if possible, otherwise reuse reference
        const clonedImage = new Image();
        clonedImage.src = this.image.src;

        return new Sprite({
            imagePath: clonedImage,
            size: new Vector2D(this.size.x, this.size.y),
            rotation: this.rotation,
            flippedHorizontal: this.flippedHorizontal,
            crop: this.crop,
            outline: this.outline,
            opacity: this.opacity,
            blendMode: this.blendMode,
            glow: this.glow ? new Glow(
                this.glow.shadowColor,
                this.glow.shadowBlur,
                this.glow.shadowOffsetX,
                this.glow.shadowOffsetY,
                this.glow.blendMode
            ) : null,
            pos: this.pos
        });
    }
}

export class HitBox{
    size: Vector2D;
    parent: GameObject

    constructor(parent: GameObject, size: Vector2D = new Vector2D(30,50)) {
        this.parent = parent;
        this.size = size;
    }

    isCollidingWith(other: HitBox): boolean {
        const aPos = this.parent.position;
        const bPos = other.parent.position;
        // Simple AABB collision
        return (
            Math.abs(aPos.x - bPos.x) < (this.size.x + other.size.x) / 2 &&
            Math.abs(aPos.y - bPos.y) < (this.size.y + other.size.y) / 2
        );
    }
}

