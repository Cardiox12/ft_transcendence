import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { Public } from "src/common/decorators/public.decorator";
import { PaginationQueryDto } from "src/common/dto/pagination.query-dto";
import { MatchCreationDto } from "./dto/match-creation.dto";
import { UpdateMatchDto } from "./dto/match-update.dto";
import { MatchesService } from "./matches.service";

@Controller("users")
export class MatchesController {
    constructor(
        private matchesService: MatchesService
    ) { }

    @Public()
    @Post("/:user1_id/matches/:user2_id")
    async create(
        @Param("user1_id") user1_id: string,
        @Param("user2_id") user2_id: string,
        @Body() matchCreationDto: MatchCreationDto
    )
    {
        return this.matchesService.create(user1_id, user2_id, matchCreationDto);
    }

    @Public()
    @Get("/matches/:match_id")
    async findOne(
        @Param("match_id") match_id: string
    ) 
    {
        return this.matchesService.findOne(match_id);
    }

    @Public()
    @Get("/:user1_id/matches/:user2_id")
    async findAllByUser(
        @Param("user1_id") user1_id: string,
        @Param("user2_id") user2_id: string,
        @Query() paginationQueryDto: PaginationQueryDto
    )
    {
        return this.matchesService.findAllByUser(user1_id, user2_id, paginationQueryDto);
    }

    @Public()
    @Get("/:user_id/matches")
    async findAll(
        @Param("user_id") user_id: string,
        @Query() paginationQueryDto: PaginationQueryDto
    )
    {
        return this.matchesService.findAll(user_id, paginationQueryDto);
    }

    @Public()
    @Put("/matches/:match_id")
    async update(
        @Param("match_id") match_id: string,
        @Body() updateMatchDto: UpdateMatchDto
    )
    {
        return this.matchesService.update(match_id, updateMatchDto);
    }
}