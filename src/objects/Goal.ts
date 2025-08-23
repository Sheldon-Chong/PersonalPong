import { GameObject } from '../Core/GameObject'
import { HitBox } from '../Core/HitBox'

import { Point2D, Vector2D } from '../Coordinates'
import { PongGame, Team } from '../pong'


function getLastItem<T>(array: T[]): T {
    return array[array.length - 1];
}

export class Goal extends GameObject {
    constructor(game: PongGame, public team) {
        if (team === Team.TEAM1) {
            super(new Point2D(getLastItem(game.team2.players).position.x -200,0), game);
        }
        else {
            super(new Point2D(getLastItem(game.team1.players).position.x + 200,0), game);
        }
        this.hitbox = new HitBox(this, new Vector2D(20, 1000));
    }
}

