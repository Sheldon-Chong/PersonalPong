export class Point2D {
    constructor(
        public x: number,
        public y: number,
    ) {}

    add(other: Vector2D)      { return new Point2D(this.x + other.x, this.y+ other.y); }
    subtract(other: Vector2D) { return new Point2D(this.x - other.x, this.y - other.y); }
    divide(other: Vector2D)   { return new Point2D(this.x / other.x, this.y / other.y); }

    getCenter(other: Point2D): Point2D { return this.add(other.toVector2D()).divide(new Vector2D(2,2)); }

    toVector2D() { return new Vector2D(this.x, this.y); }
    clone(): Point2D { return new Point2D(this.x, this.y); }
}

export class Vector2D {
    constructor(
        public x: number,
        public y: number,
    ) {}

    add(other: Vector2D)      { return new Vector2D(this.x + other.x, this.y + other.y); }
    subtract(other: Vector2D) { return new Vector2D(this.x - other.x, this.y - other.y); }
    divide(other: Vector2D)   { return new Vector2D(this.x / other.x, this.y / other.y); }

    toPoint(): Point2D { return new Point2D(this.x, this.y) }
}

export function interpolate(pos: Point2D, pos2: Point2D, slowness: number):Point2D {
    return new Point2D(pos.x + (pos2.x - pos.x) / slowness, pos.y + (pos2.y - pos.y) / slowness);
}


export function randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

