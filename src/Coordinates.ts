export class Point2D {
    constructor(
        public x: number,
        public y: number,
    ) {}


    getCenter(other: Point2D): Point2D {
        return new Point2D(
            (this.x + other.x) / 2,
            (this.y + other.y) / 2
        );
    }

    add(other: Vector2D) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    subtract(other: Vector2D) {
        return new Point2D(this.x - other.x, this.y - other.y);
    }
    divide(other: Vector2D) {
        return new Point2D(this.x / other.x, this.y / other.y);
    }
}

export class Vector2D {
    constructor(
        public x: number,
        public y: number,
    ) {}

    toPoint(): Point2D {
        return new Point2D(this.x, this.y)
    }

    add(other: Vector2D) {
        this.x += other.x;
        this.y += other.y;
    }

    
    subtract(other: Vector2D) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }
    divide(other: Vector2D) {
        return new Vector2D(this.x / other.x, this.y / other.y);
    }
}

