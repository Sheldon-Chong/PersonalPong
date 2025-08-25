
import { Point2D, Vector2D, interpolate } from './Coordinates'
import { GameObject, Sprite, HitBox, Glow, Particle, Timer} from './Index'
import {  BlendMode } from './GameUtils'
import { Label, Ball, Camera, Arrow, Goal, Image, Player } from './Index.ts'

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

    static leftBoardControls = [["t", "g"], ["r", "f"], ["w", "s"]];
    static rightBoardControls = [["y", "h"], ["o", "l"], ["ArrowUp", "ArrowDown"]];

    constructor(
        public game: PongGame,
        public name: String,
    ) {

    }
}


export class Padel extends GameObject {
    isMoving: boolean = false;
    sprite: Sprite = new Sprite({imagePath: "assets/skins/ghost_light.png", size: new Vector2D(60, 60)});
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

        this.addChild(new Label({
            text: this.player.name, 
            position : new Point2D(0, -50), 
            game: game,
            font: "15px Century Gothic", 
            color: "#ffffff"}));

        this.maximumVelocity = new Vector2D(
            this.game.gameSettings.playerAcceleration * 10, 
            this.game.gameSettings.playerAcceleration * 10
        );
        this.sprite = player.skin ? player.skin : this.sprite; 

        // add shadow
        this.sprite.glow = new Glow("#3731FE", 10, 0, 5, BlendMode.Multiply);

            
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
            copied.blendMode = BlendMode.ColorDodge;
            copied.glow = null;
            this.game.particles.particles.push(new Particle(this.game, 120, copied, this.position.clone(), (instance) => {
                instance.sprite.opacity *= 0.96;
            }));

            return true;
        }
        this.addChild(new Arrow(this.game));

        const eyeOffset = this.team === Team.TEAM1 ? 3 : -3;
        const irisOffset = this.team === Team.TEAM1 ? 8 : -8;

        this.addChild(new TrailSprite(this.game, this, new Sprite({
            imagePath: "./assets/skins/components/eyes.png",
            size: new Vector2D(38, 24),
            pos: new Point2D(eyeOffset, -3)
        }), 160));

        this.addChild(new TrailSprite(this.game, this, new Sprite({
            imagePath: "./assets/skins/components/iris.png",
            size: new Vector2D(30, 12),
            pos: new Point2D(irisOffset, -3)
        }), 250));
    }
}

export class Filter {
    test: BlendMode;
}

class ParticleLayer extends GameObject {
    particles: Particle[] = []
    
    constructor (game: PongGame) {
        super(new Point2D(0,0), game);
    }
}

class TrailSprite extends GameObject {
    truePos: Point2D = new Point2D(0,0);

    constructor(
        game: PongGame, 
        public target: GameObject, 
        sprite: Sprite,
        interpolateVal = 1.6
    ) {
        super(new Point2D(0,0), game);

        this.sprite = sprite;

        this.onUpdate = () => {
            this.truePos = interpolate(this.truePos, target.position, interpolateVal * this.game.delta);

            return true;
        }
    }

    getWorldPosition(): Point2D {
        return new Point2D(
            this.truePos.x - this.game.camera.position.x,
            this.truePos.y - this.game.camera.position.y
        ).add(this.game.canvasSize.divide(new Vector2D(2,2)));
    }
}


export class PongGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    canvasSize: Vector2D;

    sprites: Sprite[] = [];

    lastFrameTime: number = performance.now();
    fps: number = 0;
    delta: number;

    particles: ParticleLayer;
    particles2: ParticleLayer;
    timers: Timer[] = [];
    gameObjects: GameObject[] = [];
    filter: Image[] =[];

    team1: GameTeam = new GameTeam(this, Team.TEAM1);
    team2: GameTeam = new GameTeam(this, Team.TEAM2);
    
    ball: Ball;
    camera: Camera = this.addObject(new Camera(new Point2D(0,-100), this)) as Camera;
    gameSettings: GameSettings = new GameSettings();

    renderFrame() {
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const obj of this.gameObjects) {
            if (obj instanceof ParticleLayer) {
                for (const particle of obj.particles) {
                    particle.draw();
                }
            }
            obj.Draw();
        }
    }


    updateDeltaTime() {
        const now = performance.now();
        this.delta = (now - this.lastFrameTime) / 1000; // seconds
        const MAX_DELTA = 10; // 10 seconds, adjust as needed
        this.delta = Math.min(this.delta, MAX_DELTA);
        this.fps = 1 / this.delta;
        this.lastFrameTime = now;
    }

    loop = () => {
        // update delta time
        this.updateDeltaTime();

        // update objects
        for (const obj of this.gameObjects) {
            if (obj instanceof ParticleLayer) {
                for (let i = obj.particles.length - 1; i >= 0; i--) {
                    let particle = obj.particles[i];
                    particle.update();
                    if (!particle.isAlive()) {
                        obj.particles.splice(i, 1);
                    }
                }
            }
            obj.update(this.delta);
        }
        
        // updpate timers
        for (const timer of this.timers) 
            timer.update();
        
        // update particles


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
        
        return object;
    }

    skins: Sprite[] = [];
    skinNames: string[] = [
        "ghost_42",
        "ghost_blue",
        "ghost_dark",
        "ghost_green",
        "ghost_light",
        "ghost_purple",
        "ghost_red",
        "ghost_yellow",
    ];

    constructor(canvas: HTMLCanvasElement) {
        // this.camera = this.addObject(new Camera(new Point2D(0,0), this)) as Camera;
        this.canvas = canvas;
        this.canvasSize = new Vector2D(1500, 530).multiply(0.94); // Set desired canvas size here

        this.canvas.width = this.canvasSize.x;
        this.canvas.height = this.canvasSize.y;

        this.canvas.style.border = "4px solid #ffffff";
        this.canvas.style.borderRadius = "20px";

        for (const skin of this.skinNames) {
            this.skins.push(new Sprite({
                size: new Vector2D(60, 60), 
                imagePath: "./assets/skins/" + skin + ".png"}
            ));
        }
        
        let players: Player[] = [
            new Player({name: "player1asjdklasd", profileImage: "assets/profile1.webp"}),
            new Player({name: "player2", profileImage: "assets/profile2.webp", skin: this.skins[5]}),
            new Player({name: "player3", skin: this.skins[3]}),
            new Player({name: "player4", skin: this.skins[2]}),
            new Player({name: "player5", skin: this.skins[5]}),
            new Player({name: "player6", skin: this.skins[1]}),
        ];

        const ctx = this.canvas.getContext('2d')!;
        this.ctx = ctx;
        if (players.length % 2 !== 0)  throw new Error ("Only even number of players allowed");
        if (players.length > this.gameSettings.maxPlayerCount)  throw new Error ("Only even number of players allowed");
        
        const offset = 250;
        const distance = 200;

        let bg = new Sprite({imagePath: "./assets/maps/map2.png", size: new Vector2D(2700,500), glow: null});

        this.addObject(new Image(this, new Point2D(0,0), bg));
        // INITIALIZE TEAMS AND SCORES
        this.particles = this.addObject(new ParticleLayer(this)) as ParticleLayer;


        for (let i = 0; i < players.length; i ++) {
            if (i % 2 === 0) {
                let padel = new Padel(new Point2D((i*distance*-1) - offset, 0), this, Team.TEAM1, players[i], "s", "w");
                this.team2.players.push(padel);
                this.addObject(padel);

                padel.moveUpKey = GameTeam.leftBoardControls[(i)/2][0];
                padel.moveDownKey = GameTeam.leftBoardControls[(i)/2][1];
            }
            else {
                let padel = new Padel(new Point2D(((i-1) * distance) + offset, 0), this, Team.TEAM2, players[i]);
                
                padel.moveUpKey = GameTeam.rightBoardControls[(i-1)/2][0];
                padel.moveDownKey = GameTeam.rightBoardControls[(i-1)/2][1];
                this.team1.players.push(padel);
                this.addObject(padel);
            }
        }



        
        this.team1.scoreUI = this.addObject(new Label({
            text: "none",
            position: new Point2D(-500, 0),
            game: this,
            font: "bold 100px Arial",
            color: "#4C568C"
        })) as Label;
        this.team2.scoreUI = this.addObject(new Label({
            text: "none",
            position: new Point2D(500, 0),
            game: this,
            font: "bold 100px Arial",
            color: "#4C568C"
        })) as Label; this.ball = this.addObject(new Ball(new Point2D(0, 0), this)) as Ball;
        this.ball.velocity.x = this.gameSettings.ballSpeed;


        this.addObject(new Goal(this, Team.TEAM1));
        this.addObject(new Goal(this, Team.TEAM2));
        
        
        let sprite = new Sprite({imagePath: "Black.png", size: this.canvasSize});
        sprite.blendMode = BlendMode.Color;
        sprite.glow = null;
        let image = new Image(this, new Point2D(0, 0), sprite);
        this.addObject(image);
        this.filter.push(image);

        let sprite2 = new Sprite({imagePath: null, size: this.canvasSize});
        sprite2.blendMode = BlendMode.Difference;
        sprite2.glow = null;
        let image2 = new Image(this, new Point2D(0, 0), sprite2);
        this.addObject(image2);
        this.filter.push(image2);


        this.particles2 = this.addObject(new ParticleLayer(this)) as ParticleLayer;


        this.loop();
    }

    // Method to add new game objects
    // addGameObject(obj: GameObject) {
    //     this.gameObjects.push(obj);
    //     return obj;
    // }

    newTimer(durationSeconds: number, callback: () => void) {
        this.timers.push(new Timer(this, durationSeconds, callback));
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