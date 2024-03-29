import { Ball } from "./ball";
import { GameVec } from "./utils/gameVec";
import { Paddle } from "./paddle";
import { GameDimension } from "./utils/dimension";
import { GameUser } from "../interfaces/gameUser";
import { GAME_CANVA_DIMENSION, WIN_SCORE } from "./utils/constants";
import { UpdateMatchDto } from "src/matches/dto/match-update.dto";
import { MatchOutcomeEnum } from "src/matches/entity/match.entity";
import { Socket } from "socket.io";

export enum WallSide {
  NONE = 0,
  LEFT = 1,
  RIGHT = 2
}

export class Game {
  private canva: GameDimension;
  private middle: GameVec;
  private paddleLeft: Paddle;
  private paddleRight: Paddle;
  private ball: Ball;
  private playerTurn: boolean;
  private started: boolean;
  private alive: boolean;
  public player_1: GameUser;
  public player_2: GameUser;
  private player_1_score: number;
  private player_2_score: number;
  private end_date: Date;
  private spectators: Set<Socket>;

  constructor(player_1: GameUser, player_2: GameUser) {
    this.canva = GAME_CANVA_DIMENSION;
    this.player_1 = player_1;
    this.player_2 = player_2;
    this.spectators = new Set<Socket>();
    this.player_1_score = 0;
    this.player_2_score = 0;
    this.middle = new GameVec(
      Math.floor(this.canva.width / 2),
      Math.floor(this.canva.height / 2)
    );
    this.paddleLeft = new Paddle(this.canva, true);
    this.paddleRight = new Paddle(this.canva, false);
    this.ball = new Ball(this.canva);
    this.playerTurn = true;
    this.ball.start(this.playerTurn);
    this.started = false;
    this.alive = true;
  }

  start() {
    this.started = true;
  }

  end() {
    this.end_date = new Date();
    this.alive = false;
    this.started = false;
    this.emitGameEnd();
  }

  subscribeSpectator(spectator: Socket) {
    this.spectators.add(spectator);
  }

  unsubscribeSpectator(spectator: Socket) {
    this.spectators.delete(spectator);
  }

  isAlive() {
    return this.alive;
  }

  // Check collide and update match
  /* -------------------------------------------------------------- */
  update() {
    if ( this.started && this.alive ) {
      this.emitBallPos();
      this.emitGameStateToSpectators();
      this.ball.update();

      const outside = this.ball.isOut();
      if ( this.checkVictory() ) {
        this.end();
      }
      else if ( outside !== WallSide.NONE ) {
        if ( outside === WallSide.LEFT ){
          this.incRightScore();
        } else {
          this.incLeftScore();
        }
        this.emitScore();
        this.playerTurn = !this.playerTurn;
        this.ball.start(this.playerTurn);
      }
      else if ( this.ball.wallCollide() ) {
        this.ball.wallBounce();
      }
      else if ( this.paddleLeft.collide(this.ball) ) {
        this.ball.bounceLeft(this.paddleLeft);
      }
      else if ( this.paddleRight.collide(this.ball) ) {
        this.ball.bounceRight(this.paddleRight);
      }
    }
  }

  checkVictory() : boolean {
    return this.player_1_score >= WIN_SCORE || this.player_2_score >= WIN_SCORE;
  }

  getLeftPlayerOutcome() : MatchOutcomeEnum {
    if ( this.player_1_score > this.player_2_score ){
      return MatchOutcomeEnum.WON;
    }
    return MatchOutcomeEnum.LOST;
  }

  getRightPlayerOutcome() : MatchOutcomeEnum {
    if ( this.player_1_score < this.player_2_score ) {
      return MatchOutcomeEnum.WON;
    }
    return MatchOutcomeEnum.LOST;
  }

  /**
   * Emit game end signal to both players.
   */
  emitGameEnd() {
    const leftOutcome = this.getLeftPlayerOutcome();
    const rightOutcome = this.getRightPlayerOutcome();
    const player1_name = this.player_1.user.username;
    const player2_name = this.player_2.user.username;
    const victory = leftOutcome > rightOutcome ? player1_name : player2_name; 

    this.player_1.socket.emit("game-end", victory);
    this.player_2.socket.emit("game-end", victory);

    this.spectators.forEach((spectator) => {
      spectator.emit("spectator-game-end", victory);
    })
  }



  /**
   * Emit ball position to both player.
   */
  emitBallPos() {
    const ball_pos = this.ball.getPos();

    this.player_1.socket.emit("ball-pos", { x: ball_pos.x, y: ball_pos.y });
    this.player_2.socket.emit("ball-pos", { x: ball_pos.x, y: ball_pos.y });
  }

  /**
   * Emit score to players and spectators.
   */
  emitScore() {
    const left_score = this.player_1_score;
    const right_score = this.player_2_score;
    const player1 = this.player_1.user.username;
    const player2 = this.player_2.user.username;
    
    this.player_1.socket.emit("score", { left_score, right_score });
    this.player_2.socket.emit("score", { left_score, right_score });


    this.spectators.forEach((spectator) => {
      spectator.emit("spectator-score", { left_score, right_score });
    });
  }

  /**
   * Emit game state to spectators.
   */
  emitGameStateToSpectators() {
    const ball_pos = this.ball.getPos();
    const left_paddle_pos = this.paddleLeft.getPos();
    const right_paddle_pos = this.paddleRight.getPos();

    this.spectators.forEach((spectator) => {
      spectator.emit("game-state", {
        ball_pos,
        left_paddle_pos: left_paddle_pos.y,
        right_paddle_pos: right_paddle_pos.y
      })
    });
  }

  incLeftScore() {
    this.player_1_score++;
  }

  incRightScore() {
    this.player_2_score++;
  }

  setLeftPaddlePos(y: number) {
    this.paddleLeft.setPos(y);
  }

  setRightPaddlePos(y: number) {
    this.paddleRight.setPos(y);
  }

  getGameStats() : UpdateMatchDto {
    const end_date = this.end_date;
    const player_1_point = this.player_1_score;
    const player_2_point = this.player_2_score;
    let player_1_outcome: MatchOutcomeEnum = this.getLeftPlayerOutcome();
    let player_2_outcome: MatchOutcomeEnum = this.getRightPlayerOutcome();

    return {
      player_1_point,
      player_2_point,
      player_1_outcome,
      player_2_outcome,
      end_date
    };
  }

  upLeft() {
    this.paddleLeft.up();
  }

  upRight() {
    this.paddleRight.up();
  }

  downLeft() {
    this.paddleLeft.down();
  }

  downRight() {
    this.paddleRight.down();
  }
}