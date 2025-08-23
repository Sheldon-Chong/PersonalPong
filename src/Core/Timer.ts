import { Point2D, Vector2D } from '../Coordinates';
import type { PongGame } from '../pong';
import { GameObject } from './GameObject';

export class Timer extends GameObject {
    private startTime: number;
    private duration: number;
    private callback: () => void;
    private triggered: boolean = false;

    constructor(game: PongGame, durationSeconds: number, callback: () => void) {
        super(new Point2D(0,0), game);
        this.startTime = performance.now();
        this.duration = durationSeconds * 1000;
        this.callback = callback;
    }

    update() {
        if (!this.triggered && (performance.now() - this.startTime) >= this.duration) {
            this.triggered = true;
            this.callback();
        }
    }
}
