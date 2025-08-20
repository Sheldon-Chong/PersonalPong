
import { Point2D, Vector2D, interpolate } from './Coordinates'
import { GameObject, Sprite, HitBox, Glow} from './GameUtils'
import { Camera } from './objects/Camera'
import { Label } from './objects/Label'

class GameSettings {
    playerAcceleration: number = 1;
    playerCount: number = 6;
    maxPlayerCount: number = 6;
    ballSpeed: number = 60;
}

enum Team {
    TEAM1= "team1",
    TEAM2= "team2"
}

class GameTeam {
    score: number = 0;
    players: Padel[] = [];
    scoreUI: Label;

    constructor(
        public game: PongGame,
        public name: String,
    ) {

    }
}

class Ball extends GameObject {
    rotationAcceleration: number = 0;
    rotationVelocity: number = 0;
    lastHit: string;
    collided: boolean = false;
    static MAX_BOUNCE_ANGLE = Math.PI / 3;

    hitbox: HitBox;
    sprite: Sprite;

    onHitGoal(team: string) {
        const center =  new Point2D(this.game.canvasSize.x,this.game.canvasSize.y).divide(new Vector2D(2,2));
        this.position = center;
        this.game.camera.rawPosition = new Point2D(0,0);
        this.game.camera.shakeValue = new Vector2D(30,30);
        
        if (team === Team.TEAM1) {
            this.velocity.x = 60;
            this.game.team2.score++;
        }
        if (team === Team.TEAM2) {
            this.velocity.x = -60;
            this.game.team1.score++;
        }
    }

    calculateAngle(other: Padel) {
        const paddleCenterY = other.position.y + other.hitbox!.size.y / 2;
        const ballCenterY = this.position.y + this.hitbox.size.y / 2;
        const relativeIntersectY = (ballCenterY - paddleCenterY);
        const normalizedIntersectY = relativeIntersectY / (this.game.canvasSize.y / 2);
        const bounceAngle = normalizedIntersectY * Ball.MAX_BOUNCE_ANGLE;
        const direction = other.team === Team.TEAM2 ? -1 : 1;
        this.velocity.x = this.game.gameSettings.ballSpeed * Math.cos(bounceAngle) * direction;
        this.velocity.y = this.game.gameSettings.ballSpeed * Math.sin(bounceAngle);
        this.rotationVelocity = 0.4;

    }

    constructor(
        startingPosition: Point2D,
        public game: PongGame
    ) {
        super(startingPosition, game);
        this.size = new Vector2D(35, 35);
        this.sprite = new Sprite("assets/pacman.png", new Vector2D(60, 60));
        this.sprite.glow = new Glow("#fc650d", 7);
        this.hitbox = new HitBox(this, this.sprite.size);
        this.name = "ball";

        this.onCollide = (other) => {
            if (other instanceof Padel) {
                this.calculateAngle(other);

                if (other.team === Team.TEAM1 && this.lastHit !== other.team) 
                    this.game.camera.target = new Point2D(300, 0);
                if (other.team === Team.TEAM2 && this.lastHit !== other.team) 
                    this.game.camera.target = new Point2D(-300, 0);
                this.lastHit = other.team;
                this.collided = true;
            }

            else if (other instanceof Goal) {
                this.onHitGoal(other.team);
            }
            return true;
        };

        this.onUpdate = () => {
            this.sprite.rotation += this.rotationVelocity;
            this.rotationVelocity *= 0.98;
            if (this.position.y - this.hitbox.size.y / 2 < 0)
                this.position.y = this.hitbox.size.y / 2;
            if (this.position.y + this.hitbox.size.y / 2 > this.game.canvasSize.y)
                this.position.y = this.game.canvasSize.y - this.hitbox.size.y / 2;
            return true;
        };
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

        if (this.parent.team === Team.TEAM2) {
            x = this.game.canvasSize.x - 45;
        }
        if (this.parent.team === Team.TEAM1) {
            this.sprite.flippedHorizontal = true;
        }

        this.sprite.drawImg(this.ctx, 
            new Point2D(x, this.position.y - this.game.camera.position.y + this.parent.position.y), 
            this.sprite.size, 0
        );
    }
}

class ProfileImage extends GameObject {
    constructor(public game: PongGame, public profileImage: string = "assets/profile1.webp") {
        super(new Point2D(0,-70), game);
        this.sprite = new Sprite(profileImage, new Vector2D(30,30), false, true, true);
        this.sprite.glow = null;
    }
}

class Padel extends GameObject {
    isMoving: boolean = false;
    sprite: Sprite;
    hitbox: HitBox;
    maximumVelocity: Vector2D;

    constructor(
        public position: Point2D,
        public game: PongGame,
        public team: string,
        public player: Player,
        public moveDownKey: string = "ArrowDown",
        public moveUpKey: string = "ArrowUp"
    ) {
        super(position, game);

        let label = new Label(this.player.name, new Point2D(0, -50), game, "15px Arial", "#ffffff");
        this.addChild(label);

        const profileImage = new ProfileImage(this.game, this.player.profileImage);
        this.addChild(profileImage);

        this.maximumVelocity = new Vector2D(
            this.game.gameSettings.playerAcceleration * 10, 
            this.game.gameSettings.playerAcceleration * 10
        );

        this.sprite = new Sprite("assets/ghost2.webp", new Vector2D(60, 60));
        this.sprite.blendMode = "lighter";
        this.hitbox = new HitBox(this);

        if (this.team === Team.TEAM1) {
            this.sprite.flippedHorizontal = true;
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
    constructor(game: PongGame, public team) {
        if (team === Team.TEAM1) {
            super(new Point2D(-190,game.canvasSize.y/2), game);
            this.sprite = new Sprite(null,new Vector2D(100,game.canvasSize.y + 50));
        }
        else {
            super(new Point2D(game.canvasSize.x + 190,game.canvasSize.y/2), game);
            this.sprite = new Sprite(null,new Vector2D(100,game.canvasSize.y + 50));
        }
        this.hitbox = new HitBox(this, new Vector2D(20, 1000));
    }
}


class Player {
    skin: number;
    
    constructor(
            public name: string, 
            public profileImage: string = "")
        {

    }
}




export class PongGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    canvasSize: Vector2D;

    gameObjects: GameObject[] = [];

    ball: Ball;
    camera: Camera = new Camera(new Point2D(0,-100), this);
    gameSettings: GameSettings = new GameSettings();

    
    team1: GameTeam = new GameTeam(this, Team.TEAM1);
    team2: GameTeam = new GameTeam(this, Team.TEAM2);

    renderFrame() {
        this.ctx.fillStyle = "#2B304B";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const obj of this.gameObjects) {
            obj.Draw();
        }
    }
    lastFrameTime: number = performance.now();
    fps: number = 0;

    loop = () => {
        const now = performance.now();
        const delta = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;
        this.fps = 1 / delta;

        for (const obj of this.gameObjects) {
            obj.update();
        }
        this.renderFrame();
        requestAnimationFrame(this.loop);
        this.team1.scoreUI.text = String(this.team1.score);
        this.team2.scoreUI.text = String(this.team2.score);

        
        // Optionally, display FPS
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(`FPS: ${this.fps.toFixed(1)}`, 10, 20);
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
        this.camera = new Camera(new Point2D(0,0), this);
        this.canvas = canvas;
        this.canvasSize = new Vector2D(800, 400); // Set desired canvas size here
        this.canvas.width = this.canvasSize.x;
        this.canvas.height = this.canvasSize.y;
        this.canvas.style.border = "4px solid #ffffff";
        this.canvas.style.borderRadius = "20px";

        let players: Player[] = [
            new Player("test", "assets/profile1.webp"),
            new Player("hallo!!!", "assets/profile2.webp"),
            new Player("hallo!!!"),
            new Player("hallo!!!"),
            new Player("hallo!!!"),
            new Player("hallo!!!"),
            // new Player("test"),
        ];

        const ctx = this.canvas.getContext('2d')!;
        this.ctx = ctx;
        if (players.length % 2 !== 0)  throw new Error ("Only even number of players allowed");
        if (players.length > this.gameSettings.maxPlayerCount)  throw new Error ("Only even number of players allowed");
        
        
        for (let i = 0; i < players.length; i ++) {
            if (i % 2 === 0) 
                this.team2.players.push(new Padel(new Point2D(0 - (i * 50)  + 100,canvas.height/2), this, Team.TEAM1, players[i], "s", "w"));
            else 
                this.team1.players.push(new Padel(new Point2D(canvas.width + ((i - 1) * 50) - 100, canvas.height/2), this, Team.TEAM2, players[i]));
        }

        this.ball = new Ball(new Point2D(100, 100), this);
        this.ball.velocity.x = 5;

        // INITIALIZE TEAMS AND SCORES

        this.team1.scoreUI = new Label("none", new Point2D(100,canvas.height/2), this, "bold 100px Arial" , "#4C568C");
        this.team2.scoreUI = new Label("none", new Point2D(canvas.width - 100,canvas.height/2), this, "bold 100px Arial" , "#4C568C");

        this.addGameObject(this.team1.scoreUI);
        this.addGameObject(this.team2.scoreUI);

        this.addObject(this.camera);
        this.addObject(this.ball);

        // Add all paddles from both teams
        for (const padel of this.team1.players) this.addObject(padel);
        for (const padel of this.team2.players) this.addObject(padel);


        this.addObject(new Goal(this, Team.TEAM1));
        this.addObject(new Goal(this, Team.TEAM2));

        this.loop();

                // Add TextObjects for player names above paddles
        // this.addObject(new TextObject("Player 1", new Point2D(100, 100), this));
        // this.addObject(new TextObject("Player 2", new Point2D(100, 100), this));

        // this.team2Players.push(new Padel(new Point2D(100,canvas.height/2), this, Team.Player1, "s", "w"));
        // this.team2Players.push(new Padel(new Point2D(0,canvas.height/2), this, Team.Player1, "f", "r"));
        // this.team1Players.push(new Padel(new Point2D(canvas.width - 100, canvas.height/2), this, Team.Player2));
        // this.team1Players.push(new Padel(new Point2D(canvas.width - 0, canvas.height/2), this, Team.Player2, "k", "i"));

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