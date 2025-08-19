export class Point2D {
    x: number;
    y: number;

    constructor(x: number, y:number) {
        this.x = x;
        this.y = y;
    }

    getCenter(other: Point2D): Point2D {
        return new Point2D(
            (this.x + other.x) / 2,
            (this.y + other.y) / 2
        );
    }

    add(other: Vector2D) {
        this.x += other.x;
        this.y += other.y;
    }
}

export class Vector2D {
    x: number;
    y: number;

    constructor(x: number, y:number) {
        this.x = x;
        this.y = y;
    }

    toPoint(): Point2D {
        return new Point2D(this.x, this.y)
    }

    add(other: Vector2D) {
        this.x += other.x;
        this.y += other.y;
    }
}

