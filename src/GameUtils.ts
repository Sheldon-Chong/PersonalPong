import { Point2D, Vector2D } from './Coordinates'
import type { PongGame } from './pong';

export class Glow {
    constructor(
        public shadowColor: string = "red",
        public shadowBlur: number = 20,
        public shadowOffsetX: number = 0,
        public shadowOffsetY: number = 0
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
        public maximumVelocity: Vector2D = new Vector2D(5, 5),
        public size: Vector2D = new Vector2D(0, 0),
        public sprite?: Sprite,
        public hitbox?: HitBox | null,
        protected ctx: CanvasRenderingContext2D = game.ctx,
        public onCollide?: (other: GameObject) => boolean,
        public onUpdate?: () => boolean
    ) {}

    addChild(object: GameObject) {
        this.children.push(object);
        object.parent = this;
    }

    Draw() {
        if (this.sprite === undefined)
            return;
        const pos = this.getWorldPosition().subtract(this.sprite.size.divide(new Vector2D(2, 2)));
        this.sprite!.drawImg(this.ctx, pos, this.sprite.size, this.sprite.rotation);
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
            );
        }
        const parentPos = this.parent.getWorldPosition();
        return new Point2D(
            parentPos.x + this.position.x,
            parentPos.y + this.position.y
        );
    }

    update() {
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;

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

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

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

export class Sprite {
    rotation: number = 0;
    glow: Glow| null = new Glow();
    blendMode: GlobalCompositeOperation = "source-over";

    image: HTMLImageElement;

    constructor(
        imagePath: string | null,
        public size: Vector2D = new Vector2D(0, 0),
        public flippedHorizontal: boolean = false,
        public crop: boolean = false,
        public outline: boolean = false
    ) {
        // Create a circular cropped image
        const diameter = Math.max(size.x, size.y);
        const canvas = document.createElement('canvas');
        canvas.width = diameter;
        canvas.height = diameter;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.save();
            if (crop) {
                ctx.beginPath();
                ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
            }
            let img = new Image();
            if (imagePath) {
                img.src = imagePath;
            } else {
                img.src = createColoredImage("#ffffff", size).src;
            }
            // Draw image after it loads
            img.onload = () => {
                ctx.drawImage(img, 0, 0, diameter, diameter);
                this.image.src = canvas.toDataURL();
            };
        }
        this.image = new Image();
        // Set a placeholder until loaded
        this.image.src = canvas.toDataURL();
        if (size.x === 0 && size.y === 0) {
            this.size = new Vector2D(this.image.width, this.image.height);
        }
    }

    drawImg(
        ctx: CanvasRenderingContext2D,
        pos: Point2D,
        size: Vector2D,
        angle: number, // in radians
        glow: Glow = new Glow(),
        // projection: number = 4
    ) {
        ctx.save();
        ctx.translate(pos.x + size.x / 2, pos.y + size.y / 2); // Move to center of image
        ctx.rotate(angle);
        ctx.globalCompositeOperation = this.blendMode;
        if (this.glow) {
            ctx.shadowColor = this.glow.shadowColor; // Glow color
            ctx.shadowBlur = this.glow.shadowBlur;           // Glow strength
            ctx.shadowOffsetX = this.glow.shadowOffsetX;
            ctx.shadowOffsetY = this.glow.shadowOffsetY;
        }
        if (this.flippedHorizontal) 
            ctx.scale(-1, 1); // Flip horizontally

        // outline stroke section
        if (this.outline) {
            ctx.beginPath();
            const diameter = Math.max(size.x, size.y);
            ctx.arc(0, 0, diameter / 2, 0, Math.PI * 2);
            ctx.strokeStyle = "black"; // You can replace "black" with a variable if needed
            ctx.lineWidth = 2; // You can replace 2 with a variable if needed
            ctx.stroke();
        }

        ctx.drawImage(this.image, -size.x / 2, -size.y / 2, size.x, size.y); // Draw centered

        ctx.restore();
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

