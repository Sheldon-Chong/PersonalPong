import { Point2D, Vector2D, interpolate,randomBetween } from '../Coordinates';
import { GameObject } from '../GameUtils';
import { PongGame } from '../pong';

export class Camera extends GameObject {
    shakeValue: Vector2D = new Vector2D(0,0);
    target: Point2D = new Point2D(0,0);
    rawPosition: Point2D;

    constructor (startingPos: Point2D, game: PongGame) {
        super(startingPos, game);
        this.name = "camera";
        this.rawPosition = startingPos;
        this.position = startingPos;
        
        this.onUpdate = () => {
            this.rawPosition = interpolate(this.rawPosition, new Point2D(this.game.ball.position.x, this.position.y), 80);
            this.position = this.rawPosition.add(new Vector2D(randomBetween(-this.shakeValue.x,this.shakeValue.x), randomBetween(-this.shakeValue.y,this.shakeValue.y)));
            this.shakeValue = this.shakeValue.divide(new Vector2D(1.03, 1.03));
            if (this.shakeValue.x > 60) {
                for (const filter of this.game.filter) {
                    filter.sprite!.opacity = 1;
                }
            }
            else {
                for (const filter of this.game.filter) {
                    filter.sprite!.opacity = 0;
                }
            }

            return true;
        }
    }
}