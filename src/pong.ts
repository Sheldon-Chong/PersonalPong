
import { Point2D, Vector2D } from './Coordinates'
import { GameObject, Sprite, HitBox, Glow, drawImg} from './GameUtils'

function interpolate(pos: Point2D, pos2: Point2D, slowness: number):Point2D {
    return new Point2D(pos.x + (pos2.x - pos.x) / slowness, pos.y + (pos2.y - pos.y) / slowness);
}

class Camera extends GameObject {
    shakeValue: Vector2D = new Vector2D(100,100);
    target: Point2D = new Point2D(0,0);
    rawPosition: Point2D;

    constructor (startingPos: Point2D, game: PongGame) {
        super(startingPos, game);
        this.name = "camera";
        this.rawPosition = startingPos;
        this.position = startingPos;
        
        this.onUpdate = () => {
            console.log(this.game.camera.position.x);
            this.rawPosition = interpolate(this.rawPosition, this.target, 100);
            this.position = this.rawPosition.add(new Vector2D(randomBetween(-this.shakeValue.x,this.shakeValue.x), randomBetween(-this.shakeValue.y,this.shakeValue.y)));
            this.shakeValue = this.shakeValue.divide(new Vector2D(1.1, 1.1));

            if (this.game.ball.lastHit === "player1") 
                this.target = new Point2D(300, 0);
            
            if (this.game.ball.lastHit === "player2") 
                this.target = new Point2D(-300, 0);

            return true;
        }
    }
}

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



function randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

class GameSettings {
    playerAcceleration: number = 0.4;
    playerCount: number = 6;
    ballSpeed: number = 60;
}



class Ball extends GameObject{

    rotationAcceleration: number = 0;
    rotationVelocity: number = 0;
    lastHit: string;

    collided: boolean = false;
    static MAX_BOUNCE_ANGLE = Math.PI / 3;
    
    hitbox: HitBox; // not nullable
    sprite: Sprite;

    constructor(startingPosition: Point2D, parent: PongGame) {
        super(startingPosition, parent);
        this.size = new Vector2D(35, 35); // Example size, adjust as needed
        this.sprite = new Sprite("assets/pacman.png", new Vector2D(60, 60));
        this.sprite.glow = new Glow("#fc650d", 7);

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

class Arrow extends GameObject{
    sprite: Sprite;
    declare parent: Padel;

    constructor (game: PongGame) {
        super(new Point2D(0, 0), game);
        this.sprite = new Sprite("assets/arrow.png",new Vector2D(30,30));



        this.onUpdate = () => {
            this.position.x = 50;
            return true;
        }
    }

    Draw() {
        let x = 0;

        if (this.parent.team === "player2") {
            x = this.game.canvasSize.x - 45;
        }
        if (this.parent.team === "player1") {
            this.sprite.flippedHorizontal = true;
        }

        drawImg(this.ctx, this.sprite, 
            new Point2D(x, this.position.y - this.game.camera.position.y + this.parent.position.y), 
            this.sprite.size, 0
        );
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
            name: string,
            team: string,
            moveDownKey: string = "ArrowDown",
            moveUpKey: string = "ArrowUp",
        ) {
            
        super(startingPosition, game);

        this.name = name;
        this.team = team;

        let label = new TextObject(this.name, new Point2D(0, -40), game, "20px Arial", "#ffffff");
        this.addChild(label);


        this.moveDownKey = moveDownKey;
        this.moveUpKey = moveUpKey;
        this.maximumVelocity = new Vector2D(
            this.game.gameSettings.playerAcceleration * 10, 
            this.game.gameSettings.playerAcceleration * 10
        );

        this.sprite = new Sprite("assets/ghost2.webp", new Vector2D(60, 60));
        this.hitbox = new HitBox(this);
                
        if (this.team === "player1") {
            this.sprite!.flippedHorizontal = true;
        }
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
        this.addChild(new Arrow(this.game));
    }
}

class Goal extends GameObject {
    constructor(game: PongGame, team: string) {
        super(new Point2D(0,0), game);
    }
}


class Player {
    name: string;
    constructor( name: string) {
        this.name = name;
    }
}

export class PongGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    canvasSize: Vector2D;

    gameObjects: GameObject[] = [];
    player1: Padel;
    player2: Padel;

    team1Players: Padel[] = [];
    team2Players: Padel[] = [];
    ball: Ball;
    
    scoreLeftUI: TextObject;
    scoreRightUI: TextObject;

    team1Score: number = 0;
    team2Score: number = 0;

    camera: Camera = new Camera(new Point2D(0,-100), this);

    gameSettings: GameSettings = new GameSettings();

    
    renderFrame() {
        this.ctx.fillStyle = "#2B304B";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const obj of this.gameObjects) {
            obj.Draw();
        }
    }


    loop = () => {
        
        for (const obj of this.gameObjects) {
            obj.update();
        }
        this.renderFrame();
        requestAnimationFrame(this.loop);
        this.scoreLeftUI.text = String(this.team1Score);
        this.scoreRightUI.text = String(this.team2Score);

    }


    addObject(object: GameObject) {
        this.gameObjects.push(object);
        if (object.children && object.children.length > 0) {
            for (const child of object.children) {
                this.addObject(child);
            }
        }
    }


    constructor(canvas: HTMLCanvasElement) {
        this.camera = new Camera(new Point2D(0,-100), this);
        this.canvas = canvas;
        this.canvasSize = new Vector2D(800, 400); // Set desired canvas size here
        this.canvas.width = this.canvasSize.x;
        this.canvas.height = this.canvasSize.y;
        this.canvas.style.border = "4px solid #ffffff";
        this.canvas.style.borderRadius = "20px";

        let players: Player[] = [
            new Player("test"),
            new Player("hallo!!!"),
            new Player("hallo!!!"),
            new Player("hallo!!!"),
            new Player("hallo!!!"),
            new Player("hallo!!!"),
            new Player("hallo!!!"),
            // new Player("test"),
        ];

        let ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error("Canvas 2D context not available");
            return;
        }
        this.ctx = ctx;
        if (this.gameSettings.playerCount % 2 !== 0) {
            
        }
        
        for (let i = 0; i < players.length; i ++) {
            if (i % 2 === 0) {
                this.team2Players.push(new Padel(new Point2D(0 - (i * 50)  + 100,canvas.height/2), this, players[i].name, "player1", "s", "w"));
            } else {
                this.team1Players.push(new Padel(new Point2D(canvas.width + ((i - 1) * 50) - 100, canvas.height/2), this, players[i].name, "player2"));
            }
        }

        // this.team2Players.push(new Padel(new Point2D(100,canvas.height/2), this, "player1", "s", "w"));
        // this.team2Players.push(new Padel(new Point2D(0,canvas.height/2), this, "player1", "f", "r"));
        // this.team1Players.push(new Padel(new Point2D(canvas.width - 100, canvas.height/2), this, "player2"));
        // this.team1Players.push(new Padel(new Point2D(canvas.width - 0, canvas.height/2), this, "player2", "k", "i"));

        this.ball = new Ball(new Point2D(100, 100), this);
        this.ball.velocity.x = 5;

        this.scoreLeftUI = new TextObject("10", new Point2D(100,canvas.height/2), this, "bold 100px Arial" , "#4C568C");
        this.scoreRightUI = new TextObject("10", new Point2D(canvas.width - 100,canvas.height/2), this, "bold 100px Arial" , "#4C568C");

        this.addGameObject(this.scoreLeftUI);
        this.addGameObject(this.scoreRightUI);
        this.addObject(this.camera);

        this.addObject(this.ball);

        // Add all paddles from both teams
        for (const padel of this.team1Players) {
            this.addObject(padel);
        }
        for (const padel of this.team2Players) {
            this.addObject(padel);
        }

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

    // drawCircle(
    //     pos: Point2D, 
    //     radius: number, 
    //     color: string = "black"
    // ) {
    //     this.ctx.beginPath();
    //     this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    //     this.ctx.fillStyle = color;
    //     this.ctx.fill();
    //     this.ctx.closePath();
    // }

    // drawRect (
    //     center: Point2D,
    //     size: Vector2D,
    //     color: string = "black"
    // ) {
    //     const x = center.x - size.x / 2;
    //     const y = center.y - size.y / 2;
    //     this.ctx.fillStyle = color;
    //     this.ctx.fillRect(x, y, size.x, size.y);
    // }