
import { Point2D, Vector2D } from './Coordinates'
import { GameObject, Sprite, HitBox} from './GameUtils'





class Ball extends GameObject{
    image: HTMLImageElement;

    constructor(startingPosition: Point2D, ctx: CanvasRenderingContext2D) {
        super(startingPosition, ctx);
        this.size = new Vector2D(35, 35); // Example size, adjust as needed
        this.sprite = new Sprite("f3.png", new Vector2D(60, 60));

        this.hitbox = new HitBox(this.sprite.size);
    }
}

class Padel extends GameObject {
    isMoving: boolean;

    constructor(startingPosition: Point2D, ctx: CanvasRenderingContext2D) {
        super(startingPosition, ctx);
        this.sprite = new Sprite("BloxyCola.png", new Vector2D(60, 60));
        this.hitbox = new HitBox();
        window.addEventListener("keydown", (event) => {
            if (event.key === "ArrowUp") {
                this.acceleration.y = -0.5;
                this.isMoving = true;
            }
            if (event.key === "ArrowDown") {
                this.acceleration.y = 0.5;
                this.isMoving = true;
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown"){
                this.acceleration.y = 0;
                this.isMoving = false;
            } 
        });
    }
}


class PongGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gameObjects: GameObject[] = [];
    player1: Padel;
    player2: Padel;

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





    
    renderFrame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const obj of this.gameObjects) {
            obj.Draw();
            if (obj.previewHitbox) obj.previewHitbox();
        }
    }


    loop = () => {
        this.renderFrame();
        requestAnimationFrame(this.loop);
        for (const obj of this.gameObjects) {
            obj.update();
            // obj.acceleration.add(new Vector2D(0.01,0.01));
        }
    }

    addObject(object: GameObject) {
        this.gameObjects.push(object);
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        let ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error("Canvas 2D context not available");
            return;
        }
        this.ctx = ctx;

        this.player1 = new Padel(new Point2D(100, 100), ctx);
        this.addObject(new Ball(new Point2D(100, 100), ctx));
        this.addObject(this.player1);
        


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
