import { Ball } from "./ball";
import { constrain } from "./engine/constrain";
import { GameDimension } from "./engine/dimension";
import { GameVec } from "./engine/gameVec";

export class Paddle {
	private canva: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private margin: number;
	private pos: GameVec;
	private dimension: GameDimension;
	private velocity: number;
	private side: boolean;
	private third: number;

	constructor(canva: HTMLCanvasElement, ctx: CanvasRenderingContext2D, left: boolean){
		this.canva = canva;
		this.ctx = ctx;
		this.margin = 7;
		this.pos = new GameVec(0, 0);
		this.dimension = new GameDimension(5, 25);
		this.third = Math.floor(this.dimension.height / 3);
		this.side = left;

		if ( left ) {
			this.pos.x = this.margin;
		} else {
			this.pos.x = this.canva.width - this.margin - this.dimension.width;
		}
		this.pos.y = Math.floor(this.canva.height / 2 - this.dimension.height / 2);
		this.velocity = 2;
	}

	draw() {
		this.ctx.fillRect(
			this.pos.x,
			this.pos.y,
			this.dimension.width,
			this.dimension.height
		)
	}

	up() {
		this.pos.y = constrain(
			this.pos.y - this.velocity, 
			0, 
			this.canva.height - this.dimension.height
		);
	}

	down() {
		this.pos.y = constrain(
			this.pos.y + this.velocity, 
			0, 
			this.canva.height - this.dimension.height
		);
	}

	getPos() : GameVec {
		return this.pos;
	}

	getDimension() : GameDimension {
		return this.dimension;
	}
	isLeft() : boolean {
		return (this.side);
	}

	isInsideHeight (ball: Ball): number {
		const ball_pos = ball.getPos();
		const ball_dim = ball.getDimension();

		ball_pos.y += (this.isLeft() ? 0 : ball_dim.height ); 

		if (ball_pos.y >= this.pos.y && ball_pos.y <= this.pos.y + this.dimension.height) {
			if( ball_pos.y < this.pos.y + this.third)
				return(1);
			if (ball_pos.y > this.pos.y + this.dimension.height - this.third)
				return (2);
			return (3)
		} 
		return (0);
	}
	
	collide(ball: Ball) : number {
		const ball_pos = ball.getPos();
		const ball_dim = ball.getDimension();
		const inside_height = this.isInsideHeight(ball);

		if (this.isLeft()) {
			if (ball_pos.x <= this.pos.x + this.dimension.width) {
				return inside_height;
			}
		}
		else if (ball_pos.x + this.dimension.width >= this.pos.x) {
			return inside_height;
		}
		return 0;
	}

}