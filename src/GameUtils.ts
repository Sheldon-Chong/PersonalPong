import { Point2D, Vector2D } from './Coordinates'


export class GameObject {
    position: Point2D;
    velocity: Vector2D = new Vector2D(0, 0);
    acceleration: Vector2D = new Vector2D(0, 0);
    maximumVelocity: Vector2D = new Vector2D(5,5);

    size: Vector2D;
    sprite: Sprite;
    hitbox: HitBox;
    ctx: CanvasRenderingContext2D;

    constructor(startingPosition: Point2D, ctx: CanvasRenderingContext2D) {
        this.position = startingPosition;
        this.ctx = ctx;
    }

    Draw() {
        const x = this.position.x - this.sprite.size.x / 2;
        const y = this.position.y - this.sprite.size.y / 2;
        this.ctx.drawImage(this.sprite.image, x, y, this.sprite.size.x, this.sprite.size.y);
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

        this.velocity.y *= 0.9;
        if (Math.abs(this.velocity.y) < 0.1) this.velocity.y = 0;
    }
}

export class Sprite {
    image: HTMLImageElement;
    size: Vector2D;

    constructor(imagePath: string, size: Vector2D | null = null) {
        this.image = new Image();
        this.image.src = imagePath;
        if (size == null)
            this.size = new Vector2D(this.image.width, this.image.height);
        else
            this.size = size;
    }
}

export class HitBox{
    size: Vector2D;
    constructor(size: Vector2D = new Vector2D(30,50)) {
        this.size = size;
    }
}

