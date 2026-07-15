export type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

export interface RobotState {
    x: number;
    y: number;
    f: Direction;
}

export class ToyRobot {
    private x: number | null = null;
    private y: number | null = null
    private f: Direction | null = null;
    private isPlaced: boolean = false;

    private readonly directions: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];

    constructor() { }

    
    public getState(): RobotState | null {
        if (!this.isPlaced || this.x === null || this.y === null || this.f === null) {
            return null;
        }
        return { x: this.x, y: this.y, f: this.f };
    }

    public place(x: number, y: number, f: Direction): void {
        if (x >= 0 && x <= 4 && y >= 0 && y <= 4) {
            this.x = x;
            this.y = y;
            this.f = f;
            this.isPlaced = true;
        }
    }

    public move(): void {
        if (!this.isPlaced || this.x === null || this.y === null || this.f === null) {
            return;
        }
        let nextX = this.x;
        let nextY = this.y;

        switch (this.f) {
            case 'NORTH':
                nextY += 1;
                break;
            case 'SOUTH':
                nextY -= 1;
                break;
            case 'EAST':
                nextX += 1;
                break;
            case 'WEST':
                nextX -= 1;
                break;
        }

        if (nextX >= 0 && nextX <= 4 && nextY >= 0 && nextY <= 4) {

            this.x = nextX;
            this.y = nextY;
        }
    }

    public left(): void {

        if (!this.isPlaced || this.f === null) return;


        const currentIndex = this.directions.indexOf(this.f);


        const nextIndex = (currentIndex - 1 + 4) % 4;


        this.f = this.directions[nextIndex]!;
    }

    public right(): void {

        if (!this.isPlaced || this.f === null) return;


        const currentIndex = this.directions.indexOf(this.f);


        const nextIndex = (currentIndex + 1) % 4;


        this.f = this.directions[nextIndex]!;
    }


    public report(): string {
        if (!this.isPlaced || this.x === null || this.y === null || this.f === null) {
            return "NOT PLACED";
        }
        return `${this.x},${this.y},${this.f}`;
    }
}