import { GameObject, Sprite, HitBox, Glow} from '../GameUtils'
import { Point2D, Vector2D, interpolate, randomBetween } from '../Coordinates'
import { PongGame } from '../pong'

export class Camera extends GameObject {
    shakeValue: Vector2D = new Vector2D(100,100);
    target: Point2D = new Point2D(0,0);
    rawPosition: Point2D;

    constructor (startingPos: Point2D, game: PongGame) {
        super(startingPos, game);
        this.name = "camera";
        this.rawPosition = startingPos;
        this.position = startingPos;
        
        this.onUpdate = () => {
            this.rawPosition = interpolate(this.rawPosition, this.target, 100);
            this.position = this.rawPosition.add(new Vector2D(randomBetween(-this.shakeValue.x,this.shakeValue.x), randomBetween(-this.shakeValue.y,this.shakeValue.y)));
            this.shakeValue = this.shakeValue.divide(new Vector2D(1.1, 1.1));


            return true;
        }
    }
}