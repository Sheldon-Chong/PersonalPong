import { Point2D, Vector2D, interpolate } from '../Coordinates';
import { PongGame, Team, Padel, Goal } from '../pong';
import { GameObject, Sprite, HitBox, Glow, createColoredImage, shiftImageHue, Particle} from '../GameUtils'

export class Ball extends GameObject {
    rotationAcceleration: number = 0;
    rotationVelocity: number = 0;
    lastHit: string;
    collided: boolean = false;
    static MAX_BOUNCE_ANGLE = Math.PI / 3;

    hitbox: HitBox;
    sprite: Sprite;

    onHitGoal(team: string) {
        const center =  new Point2D(0,0);
        this.position = center;
        this.game.camera.rawPosition = new Point2D(0,0);
        this.game.camera.shakeValue = new Vector2D(30,30);
        
        if (team === Team.TEAM1) {
            this.velocity.x = -this.game.gameSettings.ballSpeed;
            this.game.team2.score++;
        }
        if (team === Team.TEAM2) {
            this.velocity.x = this.game.gameSettings.ballSpeed;
            this.game.team1.score++;
        }
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
        this.size = new Vector2D(25, 25);
        this.sprite = new Sprite("assets/pacman.png", new Vector2D(40, 40));
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
            console.log("New velocity:", this.velocity.x, this.velocity.y);
            if (this.position.y < -this.game.canvasSize.y / 2) {
                this.position.y = -this.game.canvasSize.y / 2;
                this.velocity.y *= -1;
            }
            if (this.position.y > this.game.canvasSize.y / 2) {
                this.position.y = this.game.canvasSize.y / 2;
                this.velocity.y *= -1;
            }


            // let particle = new Particle(this.game, 10, this.sprite.clone(), this.position.clone());
            // particle.sprite.glow = null;
            // particle.sprite.opacity = 0.2;
            // particle.sprite.size = new Vector2D(40,40);
            // this.game.particles.push(particle);

            return true;
        };
    }
}
