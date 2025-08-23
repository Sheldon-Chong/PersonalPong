import { Point2D, Vector2D, interpolate } from '../Coordinates';
import { PongGame, Team, Padel } from '../pong';
import { GameObject, Sprite} from '../Index'

export class Arrow extends GameObject{
    sprite: Sprite;
    declare parent: Padel;

    constructor (game: PongGame) {
        super(new Point2D(0, 0), game);
        this.sprite = new Sprite({imagePath: "assets/arrow.png", size: new Vector2D(30,30)});

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

