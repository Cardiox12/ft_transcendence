import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { StatEntity } from './entities/stat.entity';

@Injectable()
export class StatsService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(StatEntity)
        private statRepository: Repository<StatEntity>
    ) { }

    async create(user_id: string) {
        const user = await this.userRepository.findOne({ where: { user_id } });

        if ( user == null ){
            return { msg: "User not found!" };
        }
        const stat = StatEntity.create();
        
        stat.user = user;
        await stat.save();
        return await this.findOne(user_id);
    }

    async findOne(user_id: string) {
        const user = await this.userRepository.findOne({ where: { user_id } });

        if ( user == null ){
            return null;
        }
        return await this.statRepository.findOne({ 
            where: {
                user: { user_id }
            }
        });
    }

    async remove(user_id: string) {
        await this.statRepository.delete({
            user: { user_id }
        });
    }
}
