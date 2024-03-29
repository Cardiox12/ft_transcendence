import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { UpdateStatDto } from './dto/stats.dto';
import { StatEntity, RankEnum } from './entities/stat.entity';

@Injectable()
export class StatsService {
    constructor(
        @InjectRepository(StatEntity)
        private statRepository: Repository<StatEntity>,
        private readonly userService: UsersService
    ) { }

    async create(username: string) {
        const user = await this.userService.findOneByName(username);
        //TODO: send an error when StatEntity already exists for user ?
        const stat = StatEntity.create();
        
        stat.user = user;
        await stat.save();

        return await this.findOne(username);
    }

    async update(username: string, updateStatDto: UpdateStatDto) {
        const stat = await this.findOne(username);

        const { game_total, game_won, game_abandonned, rank } = updateStatDto;

        if ( game_total !== undefined )
            stat.game_total = game_total;
        if ( game_won !== undefined )
            stat.game_won = game_won;
        if ( game_abandonned !== undefined )
            stat.game_abandonned = game_abandonned;
        if ( rank !== undefined )
            stat.rank = rank;
        await stat.save();
        return stat;
    }

    async GameEndUpdate(username: string, win: boolean, abandonned: boolean) {
     
        const stat = await this.findOne(username);
        stat.game_total += 1;
        stat.game_abandonned += abandonned ? 1 : 0;
        if (win) {
            stat.game_won += 1;
            stat.rank = this.updateRank(stat.rank);
        }
        await stat.save();
        return stat;
    }

    updateRank(rank: RankEnum) {
        if ( rank == RankEnum.WOOD )
            return RankEnum.BRONZE;
        else if ( rank == RankEnum.BRONZE )
            return RankEnum.SILVER;
        return RankEnum.GOLD
    }

    // async findOne(username: string) {
    //     const user = await this.userService.findOneByName(username);

    //     const stat = await this.statRepository.findOne({ 
    //         where: {
    //             user: { username }
    //         }
    //     });
    //     return stat;
    async findOne(username: string) {
        try {
            const user = await this.userService.findOneByName(username);
            const stat = await this.statRepository.findOne({
                where: {
                    user: { username }
                }
            });
            return stat;
        }
        catch {
            return undefined;
        }
    }

    async remove(username: string) {
        const stat = await this.findOne(username);

        await stat.remove();
        return { msg: "Stat successfuly removed!" };
    }
}
