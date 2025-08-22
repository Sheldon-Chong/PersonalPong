import { GameObject, Sprite, HitBox, Glow} from '../GameUtils'
import { Point2D, Vector2D, interpolate, randomBetween } from '../Coordinates'
import { PongGame } from '../pong'

export class Player {
    name: string = "";
    profileImage: string = "";
    skin: Sprite | null = null;

    constructor(params: Partial<Player> = {}) {
        Object.assign(this, params);
    }
}