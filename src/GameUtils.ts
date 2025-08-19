import { Point2D, Vector2D } from './Coordinates'
import type { PongGame } from './pong';

function drawRotatedImage(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number, // center x
    y: number, // center y
    width: number,
    height: number,
    angle: number // in radians
) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2); // Move to center of image
    ctx.rotate(angle);
    ctx.drawImage(image, -width / 2, -height / 2, width, height); // Draw centered
    ctx.restore();
}

export class GameObject {
    name: string;
    game: PongGame

    parent: GameObject | null;
    children: GameObject[] = [];

    position: Point2D;
    velocity: Vector2D = new Vector2D(0, 0);
    acceleration: Vector2D = new Vector2D(0, 0);
    maximumVelocity: Vector2D = new Vector2D(5,5);

    size: Vector2D;
    
    sprite?: Sprite;
    hitbox?: HitBox | null;

    protected ctx: CanvasRenderingContext2D;

    collisions: GameObject[] = [];

    onCollide?: (other: GameObject) => boolean;
    onUpdate?: () => boolean;

    constructor(startingPosition: Point2D, game: PongGame, parent=null) {
        this.position = startingPosition;
        this.game = game;
        this.ctx = game.ctx;
        this.parent = parent;
    }

    addChild(object:GameObject) {
        this.children.push(object);
        object.parent = this;
    }

    Draw() {
        if (this.sprite === undefined)
            return; 
        const x = this.position.x - this.sprite.size.x / 2;
        const y = this.position.y - this.sprite.size.y / 2;
        drawRotatedImage(this.ctx, this.sprite.image, x, y, this.sprite.size.x, this.sprite.size.y, this.sprite.rotation);
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
        if (!this.parent) return this.position;
        const parentPos = this.parent.getWorldPosition();
        return new Point2D(parentPos.x + this.position.x, parentPos.y + this.position.y);
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
            if (this.onUpdate)
                this.onUpdate();
        }
    }
}

export class Sprite {
    image: HTMLImageElement;
    size: Vector2D;
    rotation: number = 0;

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

