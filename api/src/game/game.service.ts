import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { UserEntity } from "src/users/entities/user.entity";
import { MatchesService } from "src/matches/matches.service";
import { Game } from "./engine/game";
import { GameMatch } from "./interfaces/match";
import { StatsService } from "src/stats/stats.service";

interface GameWithMatch {
    game: Game;
    match: GameMatch;
}

@Injectable()
export class GameService {
    private users: Map<Socket, GameWithMatch>;
    private games: Set<Game>;
    private matches: Map<Game, GameWithMatch>;
    private gamesBySpectator: Map<Socket, Game>;
    private gamesById: Map<string, Game>;

	constructor(
        private matchesService: MatchesService,
        private statsService: StatsService,
    ) 
    {
        // Init game loop here ?
        this.users = new Map<Socket, GameWithMatch>();
        this.games = new Set<Game>();
        this.matches = new Map<Game, GameWithMatch>();

        this.gamesBySpectator = new Map<Socket, Game>();
        this.gamesById = new Map<string, Game>();

        this.gameLoop();
    }

    async initGame(match: GameMatch) {
        const game = new Game(match.player_1, match.player_2);
        let seconds = 0;
        
        const timer = setInterval(() => {
            this.emitGameTimer(match, 5 - seconds);
            if ( seconds == 5 ){
                game.start();
                clearInterval(timer);
            }
            seconds++;
        }, 1000);

        this.games.add(game);
        this.matches.set(game, { game, match });

        this.gamesById.set(match.id, game);

        this.users.set(match.player_1.socket, { game, match });
        this.users.set(match.player_2.socket, { game, match });
    }

    async gameLoop() {
        this.update();

        setTimeout(() => {
            this.gameLoop();
        }, 35);
    }

    async emitGameTimer(match: GameMatch, second: number) {
        match.player_1.socket.emit("game-start-timer", second);
        match.player_2.socket.emit("game-start-timer", second);
    }

    /**
     * Update all games.
     */
    async update() {
        this.games.forEach((game) => {
            if ( !game.isAlive() ){
                // Game has ended
                this.endGame(game);
            } else {
                game.update();
            }
        })
    }

    async endGame(game: Game) {
        // Store result in DB
        // Delete match from map
        // Send event to clients
        const match = this.matches.get(game);
        const gameStats = game.getGameStats();

        const leftOutcome = game.getLeftPlayerOutcome();
        const rightOutcome = game.getRightPlayerOutcome();
        const player1_name = game.player_1.user.username;
        const player2_name = game.player_2.user.username;
        const victory = leftOutcome > rightOutcome ? player1_name : player2_name; 
    
        this.statsService.GameEndUpdate(player1_name, leftOutcome > rightOutcome, false)
        this.statsService.GameEndUpdate(player2_name, leftOutcome < rightOutcome, false)

        this.matchesService.update(match.match.id, gameStats);
        this.removeGame(game);
    }

    async removeGame(game: Game) {
        this.games.delete(game);
        this.users.delete(game.player_1.socket);
        this.users.delete(game.player_2.socket);
        this.matches.delete(game);
    }

    /**
     * Subscribe spectator to a game.
     * 
     * @param matchId 
     * @param spectator 
     */
    async subscribeSpectator(matchId: string, spectator: Socket) {
        const game = this.gamesById.get(matchId);

        if ( game ) {
            this.gamesBySpectator.set(spectator, game);
            game.subscribeSpectator(spectator);
        }
    }

    /**
     * Unsubscribe spectator from a game.
     * @param spectator 
     */
    async unsubscribeSpectator(spectator: Socket) {
        const game = this.gamesBySpectator.get(spectator);

        if ( game ) {
            this.gamesBySpectator.delete(spectator);
            game.unsubscribeSpectator(spectator);
        }
    }

    /**
     * Move up the user paddle.
     * Player_1 -> Left paddle
     * Player_2 -> Right paddle
     * @param socket 
     */
    async updateMoveUp(socket: Socket) {
        const matchWithUser = this.users.get(socket);

        if ( matchWithUser ) {
            const { game, match } = matchWithUser;

            if ( this.isLeftPlayer(socket, match) ){
                game.upLeft();
            } else {
                game.upRight();
            }
            this.streamOpponentPaddleUp(socket, match);
        }
    }

    async updateMoveDown(socket: Socket) {
        const matchWithUser = this.users.get(socket);

        if ( matchWithUser ) {
            const { game, match } = matchWithUser;

            if ( this.isLeftPlayer(socket, match) ){
                game.downLeft();
            } else {
                game.downRight();
            }
            this.streamOpponentPaddleDown(socket, match);
        }
    }

    async streamOpponentPaddleUp(socket: Socket, match: GameMatch) {
        if ( this.isLeftPlayer(socket, match) ) {
            match.player_2.socket.emit("paddle-move-up");
        } else {
            match.player_1.socket.emit("paddle-move-up");
        }
    }

    async streamOpponentPaddleDown(socket: Socket, match: GameMatch) {
        if ( this.isLeftPlayer(socket, match) ) {
            match.player_2.socket.emit("paddle-move-down");
        } else {
            match.player_1.socket.emit("paddle-move-down");
        }
    }

    isLeftPlayer(socket: Socket, match: GameMatch) {
        return socket.id === match.player_1.socket.id;
    }

    // Getter for game activity
    getGameOfUser(player: UserEntity) {
        let result = false;

        this.games.forEach( game => {
            result = game.player_1.user.username == player.username ||
                game.player_2.user.username == player.username
        });
        return result;
    }

    getCurrentMatch() {
        let currentGames:  Object[] = [];

        this.matches.forEach((matches) => {
            const match = matches.match;

            currentGames.push({
                match_id: match.id,
                player_1: match.player_1.user.username,
                player_2: match.player_2.user.username
            })
        })
        return currentGames;
    }
}