import { Point2D, Vector2D, interpolate, randomBetween } from '../Coordinates'
import { PongGame, Team, Padel } from '../pong'
import { GameObject, Sprite, HitBox, Glow, createColoredImage, shiftImageHue, Particle, Timer, BlendMode } from '../GameUtils'
import { Goal } from './Goal'

export class Ball extends GameObject {
    rotationAcceleration: number = 0;
    rotationVelocity: number = 0;
    lastPadelHit: Padel;
    collided: boolean = false;
    static MAX_BOUNCE_ANGLE = Math.PI / 3;
    onGoal: boolean = false;

    hitbox: HitBox;
    sprite: Sprite;

    onHitGoal(team: string) {
        this.velocity.x = 0;

        if (team === Team.TEAM1) 
            this.game.team2.score++;
        if (team === Team.TEAM2) 
            this.game.team1.score++;
        this.onGoal = true;
        this.game.camera.shakeValue = new Vector2D(100,100);

        for (let i = 0; i < 10; i ++) {
            this.game.particles.push(new Particle(this.game, 500, new Sprite({size: new Vector2D(10,10)}), this.position.clone(), (instance) => {
                if (instance.direction === 0) {
                    instance.direction = randomBetween(1, 360);
                    instance.speed = randomBetween(500, 1000);
                }
                instance.position = instance.position.move(instance.direction, instance.speed * this.game.delta);
                instance.sprite.size = instance.sprite.size.subtract((new Vector2D(20, 20)).multiply(this.game.delta));
                console.log(instance.sprite.size);
            }));
        }


        this.game.newTimer(2, () => {
            this.game.camera.rawPosition = new Point2D(0,0);
            this.position = new Point2D(0,0);
            this.onGoal = false;

            this.velocity.x = 0;
            this.game.newTimer(2, () => {
                if (team === Team.TEAM1) 
                    this.velocity.x = -this.game.gameSettings.ballSpeed;
                if (team === Team.TEAM2) 
                    this.velocity.x = this.game.gameSettings.ballSpeed;
    
                console.log("Timer finished!");
            })
        })
    }
    calculateAngle(other: Padel) {
        // Center positions
        const paddleCenterY = other.position.y + other.hitbox!.size.y / 2;
        const ballCenterY = this.position.y + this.hitbox.size.y / 2;

        // Calculate intersection
        const relativeIntersectY = ballCenterY - paddleCenterY;
        const normalizedIntersectY = relativeIntersectY / (other.hitbox!.size.y / 2);
        const clampedIntersectY = Math.max(-1, Math.min(normalizedIntersectY, 1));

        // Set fixed X velocity, direction based on team
        const direction = other.team === Team.TEAM2 ? -1 : 1;
        this.velocity.x = this.game.gameSettings.ballSpeed * direction;

        // Set Y velocity based on intersection
        this.velocity.y = clampedIntersectY * 200; // 0.7 scales max angle

        this.rotationVelocity = 0.4;
    }

    constructor(
        startingPosition: Point2D,
        public game: PongGame
    ) {
        super(startingPosition, game);
        // this.size = new Vector2D(25, 25);
        this.sprite = new Sprite({
            imagePath: "assets/ball.png", size: new Vector2D(40, 40),
            glow: new Glow("#3C2000", 10, 0, 0, BlendMode.Multiply),
        });
        this.hitbox = new HitBox(this, this.sprite.size);
        this.name = "ball";
        // this.lastPadelHit = this.game;

        this.onCollide = (other) => {

            if (other instanceof Padel) {

                if (this.lastPadelHit && 
                    this.lastPadelHit.team === other.team && 
                    this.lastPadelHit !== other) {
                    if (this.velocity.x > 0)
                        this.velocity.x = -this.game.gameSettings.ballSpeed;
                    else
                        this.velocity.x = this.game.gameSettings.ballSpeed;
                    console.log("slowed");
                }
                else {
                    this.calculateAngle(other);
                }
                this.lastPadelHit = other;
                this.collided = true;
            }

            else if (other instanceof Goal && !this.onGoal) {
                this.onHitGoal(other.team);
            }

            return true;
        };

        this.onUpdate = () => {
            this.sprite.rotation += this.rotationVelocity;
            this.rotationVelocity *= 0.98;
            if (this.position.y < -this.game.canvasSize.y / 2) {
                this.position.y = -this.game.canvasSize.y / 2;
                this.velocity.y *= -1;
            }
            if (this.position.y > this.game.canvasSize.y / 2) {
                this.position.y = this.game.canvasSize.y / 2;
                this.velocity.y *= -1;
            }
            this.game.particles.push(new Particle(this.game, 300, new Sprite({size: new Vector2D(10,10), glow: null}), this.position.clone(), (instance) => {
                instance.position = instance.position.move(instance.direction, instance.speed * this.game.delta);
                instance.sprite.size = instance.sprite.size.subtract((new Vector2D(33, 33)).multiply(this.game.delta));
            }));

            // let particle = new Particle(this.game, 10, this.sprite.clone(), this.position.clone());
            // particle.sprite.glow = null;
            // particle.sprite.opacity = 0.2;
            // particle.sprite.size = new Vector2D(40,40);
            // this.game.particles.push(particle);

            return true;
        };
    }
}
