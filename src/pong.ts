class TextObject extends GameObject {
    text: string;
    font: string;
    color: string;

    constructor(
        text: string,
        position: Point2D,
        game: PongGame,
        font: string = "20px Arial",
        color: string = "black",
    ) {
        super(position, game);
        this.text = text;
        this.font = font;
        this.color = color;
        this.hitbox = null;
        this.name = "string";
    }

    Draw() {
        this.ctx.font = this.font;
        this.ctx.fillStyle = this.color;
        const textWidth = this.ctx.measureText(this.text).width;
        const metrics = this.ctx.measureText(this.text);
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        const x = this.getWorldPosition().x - textWidth / 2;
        const y = this.getWorldPosition().y + textHeight / 2;
        this.ctx.fillText(this.text, x, y);
    }
}

import { Point2D, Vector2D } from './Coordinates'
import { GameObject, Sprite, HitBox} from './GameUtils'



function randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

class GameSettings {
    playerAcceleration: number = 1;
    playerCount: number = 2;
    ballSpeed: number = 10;
}



class Ball extends GameObject{

    rotationAcceleration: number = 0;
    rotationVelocity: number = 0;
    lastHit: string;

    collided: boolean = false;
    static MAX_BOUNCE_ANGLE = Math.PI / 3;
    static SPEED = 4;
    
    hitbox: HitBox; // not nullable
    sprite: Sprite;

    constructor(startingPosition: Point2D, parent: PongGame) {
        super(startingPosition, parent);
        this.size = new Vector2D(35, 35); // Example size, adjust as needed
        this.sprite = new Sprite("assets/pacman.png", new Vector2D(60, 60));

        this.hitbox = new HitBox(this, this.sprite.size);
        this.name = "ball";

        this.onCollide = (other) => {
            if (other instanceof Padel) {
                const paddleCenterY = other.position.y + other.hitbox!.size.y / 2;
                const ballCenterY = this.position.y + this.hitbox.size.y / 2;

                const relativeIntersectY = (ballCenterY - paddleCenterY);
                const normalizedIntersectY = relativeIntersectY / (this.game.canvasSize.y / 2);
                const bounceAngle = normalizedIntersectY * Ball.MAX_BOUNCE_ANGLE;
                const direction = other.team === "player2" ? -1 : 1;
                if (other.team === "player1" && this.lastHit !== other.team) {
                    this.game.team1Score ++;

                }
                if (other.team === "player2" && this.lastHit !== other.team) {
                    this.game.team2Score ++;
                }
                this.lastHit = other.team;


                this.collided = true;
                this.velocity.x = this.game.gameSettings.ballSpeed * Math.cos(bounceAngle) * direction;
                this.velocity.y = this.game.gameSettings.ballSpeed * Math.sin(bounceAngle);
                this.rotationVelocity = 0.4;
            }
            return true;
        };

        
        this.onUpdate = () => {
            this.sprite.rotation += this.rotationVelocity;
            this.rotationVelocity *= 0.98;
            if (this.position.y - this.hitbox.size.y/2 < 0)
                this.position.y = this.hitbox.size.y/2;
            if (this.position.y + this.hitbox.size.y/2 > this.game.canvasSize.y)
                this.position.y = this.game.canvasSize.y - this.hitbox.size.y/2;
            return true;
        }
    }
    
}

class Padel extends GameObject {
    isMoving: boolean;
    moveUpKey: string = "ArrowUp";
    moveDownKey: string = "ArrowDown";
    team: string;
    name: string;

    constructor(
            startingPosition: Point2D, 
            game: PongGame,
            team: string,
            moveDownKey: string = "ArrowDown",
            moveUpKey: string = "ArrowUp",
        ) {
            
        super(startingPosition, game);
        
        let name = new TextObject("Player 2", new Point2D(0, -40), game, "20px Arial", "#ffffff");
        this.addChild(name);
        
        this.name = this.constructor.name;
        this.team = team;

        this.moveDownKey = moveDownKey;
        this.moveUpKey = moveUpKey;
        this.maximumVelocity = new Vector2D(
            this.game.gameSettings.playerAcceleration * 10, 
            this.game.gameSettings.playerAcceleration * 10
        );

        this.sprite = new Sprite("assets/ghost.png", new Vector2D(60, 60));
        this.hitbox = new HitBox(this);
        
        window.addEventListener("keydown", (event) => {
            if (event.key === this.moveUpKey) {
                this.acceleration.y = -this.game.gameSettings.playerAcceleration;
                this.isMoving = true;
            }
            if (event.key === this.moveDownKey) {
                this.acceleration.y = this.game.gameSettings.playerAcceleration;
                this.isMoving = true;
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key === this.moveUpKey || event.key === this.moveDownKey){
                this.acceleration.y = 0;
                this.isMoving = false;
            } 
        });

        this.onUpdate = () => {
            this.velocity.y *= 0.9;
            if (Math.abs(this.velocity.y) < 0.1) this.velocity.y = 0;
            return true;
        }
    }
}


export class PongGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    canvasSize: Vector2D;

    gameObjects: GameObject[] = [];
    player1: Padel;
    player2: Padel;
    ball: Ball;
    
    scoreLeftUI: TextObject;
    scoreRightUI: TextObject;

    team1Score: number = 0;
    team2Score: number = 0;


    gameSettings: GameSettings = new GameSettings();

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
        this.ctx.fillStyle = "#2B304B";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const obj of this.gameObjects) {
            obj.Draw();
        }
    }


    loop = () => {
        this.renderFrame();
        requestAnimationFrame(this.loop);
        this.scoreLeftUI.text = String(this.team1Score);
        this.scoreRightUI.text = String(this.team2Score);

        for (const obj of this.gameObjects) {
            obj.update();
        }
    }


    addObject(object: GameObject) {
        console.log(`object added ${object.name}`)
        this.gameObjects.push(object);
        if (object.children && object.children.length > 0) {
            for (const child of object.children) {
                this.addObject(child);
            }
        }
    }


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvasSize = new Vector2D(800, 400); // Set desired canvas size here
        this.canvas.width = this.canvasSize.x;
        this.canvas.height = this.canvasSize.y;
        this.canvas.style.border = "4px solid #ffffff";
        this.canvas.style.borderRadius = "20px";
        

        let ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error("Canvas 2D context not available");
            return;
        }
        this.ctx = ctx;

        this.player2 = new Padel(new Point2D(100,canvas.height/2), this, "player1", "s", "w");
        this.player1 = new Padel(new Point2D(canvas.width - 100, canvas.height/2), this, "player2");

        this.ball = new Ball(new Point2D(100, 100), this);
        this.ball.velocity.x = 5;

        this.scoreLeftUI = new TextObject("10", new Point2D(100,canvas.height/2), this, "bold 100px Arial" , "#4C568C");
        this.scoreRightUI = new TextObject("10", new Point2D(canvas.width - 100,canvas.height/2), this, "bold 100px Arial" , "#4C568C");

        this.addGameObject(this.scoreLeftUI);
        this.addGameObject(this.scoreRightUI);


        this.addObject(this.ball);
        this.addObject(this.player1);
        this.addObject(this.player2);

        // Add TextObjects for player names above paddles
        // this.addObject(new TextObject("Player 1", new Point2D(100, 100), this));
        // this.addObject(new TextObject("Player 2", new Point2D(100, 100), this));

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
