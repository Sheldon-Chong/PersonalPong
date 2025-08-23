import { Point2D, Vector2D } from '../Coordinates';
import type { PongGame } from '../pong';

export class Glow {
    constructor(
        public shadowColor: string = "red",
        public shadowBlur: number = 20,
        public shadowOffsetX: number = 0,
        public shadowOffsetY: number = 0,
        public blendMode: GlobalCompositeOperation = "source-over"
    ) {}
}
