import { Point2D, Vector2D } from '../Coordinates';
import type { PongGame } from '../pong';
import { Sprite } from './Sprite';

export class Particle {
    createdAt: number;
    constructor(
        public game: PongGame,
        public lifespanMs: number,
        public sprite: Sprite,
        public position: Point2D,
        public onUpdate: (instance: Particle) => void,
        public direction = 0,
        public speed = 0
    ) {
        this.createdAt = performance.now();
    }

    draw() {
        let pos = new Point2D(
                this.position.x - this.game.camera.position.x,
                this.position.y - this.game.camera.position.y
            ).add(this.game.canvasSize.divide(new Vector2D(2,2)));
        pos = pos.subtract(this.sprite.size.divide(new Vector2D(2, 2)));
        this.sprite.drawImg(this.game.ctx, pos.add(this.sprite.pos.toVector2D()), this.sprite.size, this.sprite.rotation);
    }

    update() {
        if (this.onUpdate) this.onUpdate(this);
    }

    isAlive(): boolean {
        return (performance.now() - this.createdAt) < this.lifespanMs;
    }
}
