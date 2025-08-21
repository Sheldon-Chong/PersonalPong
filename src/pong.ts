
import { Point2D, Vector2D, interpolate } from './Coordinates'
import { GameObject, Sprite, HitBox, Glow, createColoredImage, shiftImageHue, Particle} from './GameUtils'
import { Camera } from './objects/Camera'
import { Label } from './objects/Label'
import { Ball } from './objects/Ball'

class GameSettings {
    playerAcceleration: number = 4300;
    playerCount: number = 6;
    maxPlayerCount: number = 6;
    ballSpeed: number = 700;
}

export enum Team {
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
            new Point2D(x, this.position.y - this.game.camera.position.y + this.parent.position.y + this.game.canvasSize.y/2), 
            this.sprite.size, 0
        );
    }
}

class ProfileImage extends GameObject {
    constructor(public game: PongGame, public profileImage: string = "assets/profile1.webp") {
        super(new Point2D(0,-70), game);
        // this.sprite = new Sprite(profileImage, new Vector2D(30,30), false, true, true);
        // this.sprite.glow = null;
    }
}

export class Padel extends GameObject {
    isMoving: boolean = false;
    sprite: Sprite = new Sprite("assets/ghost2.webp", new Vector2D(60, 60));
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

        // const profileImage = new ProfileImage(this.game, this.player.profileImage);
        // this.addChild(profileImage);

        this.maximumVelocity = new Vector2D(
            this.game.gameSettings.playerAcceleration * 10, 
            this.game.gameSettings.playerAcceleration * 10
        );
        this.sprite = player.skin ? player.skin : this.sprite; 
        this.sprite.glow!.blendMode = "screen";
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
          
            // oscilation
            // const min = 10;
            // const max = 20;
            // const t = performance.now() / 1000; // time in seconds

            // const value = min + (max - min) * 2* (1 + Math.sin(t));
            // this.sprite.pos.y = value;

            let copied = this.sprite.clone();
            copied.opacity = 0.1;
            copied.blendMode = "color";
            copied.glow = null;
            this.game.particles.push(new Particle(this.game, 20, copied, new Point2D(this.position.x, this.position.y)));

            return true;
        }
        this.addChild(new Arrow(this.game));
    }
}

function getLastItem<T>(array: T[]): T {
    return array[array.length - 1];
}

export class Goal extends GameObject {
    constructor(game: PongGame, public team) {
        if (team === Team.TEAM1) {
            super(new Point2D(getLastItem(game.team1.players).position.x + 200,0), game);
            this.sprite = new Sprite(null,new Vector2D(100,game.canvasSize.y + 50));
        }
        else {
            super(new Point2D(getLastItem(game.team2.players).position.x -200,0), game);
            this.sprite = new Sprite(null,new Vector2D(100,game.canvasSize.y + 50));
        }
        this.hitbox = new HitBox(this, new Vector2D(20, 1000));
    }
}


class Player {
    name: string = "";
    profileImage: string = "";
    skin: Sprite | null = null;

    constructor(params: Partial<Player> = {}) {
        Object.assign(this, params);
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

    sprites: Sprite[] = [];

    renderFrame() {
        this.ctx.fillStyle = "#2B304B";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const obj of this.gameObjects) {
            obj.Draw();
        }

        for (const particle of this.particles) {
            particle.draw();
        }
    }
    lastFrameTime: number = performance.now();
    fps: number = 0;
    delta: number;

    particles: Particle[] = [];

    loop = () => {
        const now = performance.now();
        this.delta = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;
        this.fps = 1 / this.delta;

        for (const obj of this.gameObjects) {
            obj.update(this.delta);
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            this.particles[i].sprite.opacity -= 0.004;
            // this.particles[i].sprite.size = this.particles[i].sprite.size.divide(new Vector2D(1.03,1.01));
            particle.lifespan--;
            if (particle.lifespan < 0) {
                this.particles.splice(i, 1);
            }
        }

        this.renderFrame();
        requestAnimationFrame(this.loop);
        this.team1.scoreUI.text = String(this.team1.score);
        this.team2.scoreUI.text = String(this.team2.score);

        
        // Optionally, display FPS
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(`FPS: ${this.fps.toFixed(1)} ${this.delta}`, 10, 20);
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
        this.canvasSize = new Vector2D(1500, 500); // Set desired canvas size here
        this.canvas.width = this.canvasSize.x;
        this.canvas.height = this.canvasSize.y;
        this.canvas.style.border = "4px solid #ffffff";
        this.canvas.style.borderRadius = "20px";

        // for (let i=0; i < 10; i ++) {
        //     let path = "assets/ghost2.webp";
        //     let sprite = new Sprite(path, new Vector2D(40,40));

        //     // sprite.image.onload = () => {
        //         sprite.image = shiftImageHue(sprite.image, 20);
        //     // }
        //     // sprite.image.onload = () => {
        //         this.sprites.push(sprite);
        //     // }

        // }

        let players: Player[] = [
            new Player({name: "player1asjdklasd", profileImage: "assets/profile1.webp"}),
            new Player({name: "player2", profileImage: "assets/profile2.webp", skin: this.sprites[4]}),
            new Player({name: "player3"}),
            new Player({name: "player4"}),
            new Player({name: "player5"}),
            new Player({name: "player6"}),
            // new Player("test"),
        ];

        // let sprite = new Sprite("assets/profile1.webp", new Vector2D(40,40));

        // sprite.image.onload = () => {
        //     sprite = new Sprite(shiftImageHue(sprite.image, 100), new Vector2D(40,40));
        // }
        // // sprite.image.onload = () => {
        //     // this.sprites.push(sprite);

        // players[1].skin = sprite;

        const ctx = this.canvas.getContext('2d')!;
        this.ctx = ctx;
        if (players.length % 2 !== 0)  throw new Error ("Only even number of players allowed");
        if (players.length > this.gameSettings.maxPlayerCount)  throw new Error ("Only even number of players allowed");
        
        const offset = 250;
        const distance = 200;

        for (let i = 0; i < players.length; i ++) {
            if (i % 2 === 0) 
                this.team2.players.push(new Padel(new Point2D((i*distance*-1) - offset, 0), this, Team.TEAM1, players[i], "s", "w"));
            else 
                this.team1.players.push(new Padel(new Point2D(((i-1) * distance) + offset, 0), this, Team.TEAM2, players[i]));
        }

        this.ball = new Ball(new Point2D(0, 0), this);
        this.ball.velocity.x = this.gameSettings.ballSpeed;

        // INITIALIZE TEAMS AND SCORES

        this.team1.scoreUI = new Label("none", new Point2D(-500, 0), this, "bold 100px Arial" , "#4C568C");
        this.team2.scoreUI = new Label("none", new Point2D(500, 0), this, "bold 100px Arial" , "#4C568C");

        this.addGameObject(this.team1.scoreUI);
        this.addGameObject(this.team2.scoreUI);

        this.team1.players[1].moveDownKey = "l";
        this.team1.players[1].moveUpKey = "o";

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