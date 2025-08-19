
import { Point2D, Vector2D } from './Coordinates'

class GameObject {
    position: Point2D;
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
}

class Sprite {
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

class HitBox{
    size: Vector2D;
    constructor(size: Vector2D = new Vector2D(30,50)) {
        this.size = size;
    }
}







class Ball extends GameObject{
    image: HTMLImageElement;

    constructor(startingPosition: Point2D, ctx: CanvasRenderingContext2D) {
        super(startingPosition, ctx);
        this.size = new Vector2D(35, 35); // Example size, adjust as needed
        this.sprite = new Sprite("f3.png", new Vector2D(60, 60));

        this.hitbox = new HitBox();
    }
}

class Padel extends GameObject {
    constructor(startingPosition: Point2D, ctx: CanvasRenderingContext2D) {
        super(startingPosition, ctx);
        this.sprite = new Sprite("BloxyCola.png", new Vector2D(60, 60));
    }
}


class PongGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gameObjects: GameObject[] = [];

    drawCircle(
        pos: Point2D, 
        radius: number, 
        color: string = "black"
    ) {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    drawRect (
        center: Point2D,
        size: Vector2D,
        color: string = "black"
    ) {
        const x = center.x - size.x / 2;
        const y = center.y - size.y / 2;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, size.x, size.y);
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all game objects
        for (const obj of this.gameObjects) {
            obj.Draw();
            if (obj.previewHitbox) obj.previewHitbox();
        }
    }


    loop = () => {
        this.render();
        requestAnimationFrame(this.loop);
        // Example: move all balls
        for (const obj of this.gameObjects) {
            if (obj instanceof Ball) {
                obj.position.add(new Vector2D(1, 1));
            }
        }
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        let ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error("Canvas 2D context not available");
            return;
        }
        this.ctx = ctx;

        // Create initial ball and add to gameObjects
        const ball = new Ball(new Point2D(100, 100), ctx);
        this.gameObjects.push(ball);

        this.loop();
    }

    // Method to add new game objects
    addGameObject(obj: GameObject) {
        this.gameObjects.push(obj);
    }
}

window.onload = () => {
    const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
    new PongGame(canvas);
};
