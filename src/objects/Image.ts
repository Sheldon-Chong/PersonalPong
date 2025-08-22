import { GameObject, Sprite, HitBox, Glow} from '../GameUtils'
import { Point2D, Vector2D, interpolate, randomBetween } from '../Coordinates'
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