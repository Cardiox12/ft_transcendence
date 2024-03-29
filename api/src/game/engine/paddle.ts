import { Ball } from "./ball";
import { PADDLE_VELOCITY } from "./utils/constants";
import { constrain } from "./utils/constrain";
import { GameDimension } from "./utils/dimension";
import { GameVec } from "./utils/gameVec";

export class Paddle {
	private canva: GameDimension;
	private margin: number;
	private pos: GameVec;
	private dimension: GameDimension;
	private velocity: number;
	private side: boolean;
	private third: number;
	private wall_margin: number;

	constructor(canva: GameDimension, left: boolean){
		this.canva = canva;
		this.margin = 15;
		this.wall_margin = 30;
		this.pos = new GameVec(0, 0);
		this.dimension = new GameDimension(10, 60);
		this.third = Math.floor(this.dimension.height / 3);
		this.side = left;

		if ( left ) {
			this.pos.x = this.margin;
		} else {
			this.pos.x = this.canva.width - this.margin - this.dimension.width;
		}
		this.pos.y = Math.floor(this.canva.height / 2 - this.dimension.height / 2);
		this.velocity = PADDLE_VELOCITY;
	}

	setPos(y: number) {
		this.pos.y = constrain(
			y,
			this.wall_margin,
			this.canva.height - this.dimension.height - this.wall_margin
		);
	}

	up() {
		this.pos.y = constrain(
			this.pos.y - this.velocity, 
			this.wall_margin, 
			this.canva.height - this.dimension.height - this.wall_margin
		);
	}

	down() {
		this.pos.y = constrain(
			this.pos.y + this.velocity, 
			this.wall_margin, 
			this.canva.height - this.dimension.height - this.wall_margin
		);
	}

	// Getter
	/* -------------------------------------------------------------- */
	getPos() : GameVec {
		return this.pos;
	}

	getDimension() : GameDimension {
		return this.dimension;
	}
	isLeft() : boolean {
		return (this.side);
	}

	// Check Ball collide
	/* -------------------------------------------------------------- */
	isInsideHeight (ball: Ball) : boolean {
		const ball_pos = ball.getPos();
		const ball_dim = ball.getDimension();

		// inside paddle
		if (ball_pos.y + ball_dim.height > this.pos.y && ball_pos.y < this.pos.y + this.dimension.height) {
			// higth part
			if( ball_pos.y + ball_dim.height < this.pos.y + this.third )
				return true;
			// middle part
			if (ball_pos.y + ball_dim.height < this.pos.y + this.dimension.height - this.third)
				return true;
			// down part
			return true;
		}
		return false;
	}
	
	collide(ball: Ball) : boolean {
		const ball_pos = ball.getPos();
		const ball_dim = ball.getDimension();
		const inside_height = this.isInsideHeight(ball);

		if (this.isLeft()) {
			if (ball_pos.x < this.pos.x + this.dimension.width) {
				return inside_height;
			}
		}
		else {
			if (ball_pos.x + ball_dim.width > this.pos.x)
				return inside_height;
		}
		return false;
	}
}