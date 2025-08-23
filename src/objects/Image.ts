import { GameObject, Sprite} from '../Index'
import { Point2D, Vector2D} from '../Coordinates'
import { PongGame, Team } from '../pong'

export class Image extends GameObject {
    constructor(game: PongGame, pos: Point2D, sprite: Sprite) {
        super(pos, game);
        this.sprite = sprite;
    }
    
    // Draw(): void {
    //     this.sprite?.drawImg(this.game.ctx, new Point2D(0,0), this.sprite.size, 0);
    // }
}