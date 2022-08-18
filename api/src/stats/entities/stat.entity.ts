import { UserEntity } from "src/users/entities/user.entity";
import { Column, PrimaryGeneratedColumn, Entity, BaseEntity, OneToOne, JoinColumn } from "typeorm";

export enum RankEnum {
    GOLD = "Gold",
    SILVER = "Silver",
    BRONZE = "Bronze",
    WOOD = "Wood"
}

@Entity("stat")
export class StatEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    stat_id: string;

    @Column()
    game_total: number;

    @Column()
    game_won: number;

    @Column()
    game_abandonned: number;

    @Column({
        type: "enum",
        enum: RankEnum,
        default: RankEnum.WOOD
    })
    rank: RankEnum;

    @OneToOne(() => UserEntity)
    @JoinColumn({ name: "user_id" })
    user: UserEntity;
}