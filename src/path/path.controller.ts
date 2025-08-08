import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PathService } from './path.service';
import { CreatePathDto } from './dto/create-path.dto';
import { UpdatePathDto } from './dto/update-path.dto';
import {
  FilterDuplicatedRouteInput,
  FilterDuplicatedRouteOutput,
  PubRoute,
} from './dto/path.dto';

@Controller('path')
export class PathController {
  constructor(private readonly pathService: PathService) {}

  // @Post()
  // create(@Body() createPathDto: CreatePathDto) {
  //   return this.pathService.create(createPathDto);
  // }

  // @Get()
  // findPubPath(@Query('sX')sX:number,@Query('sY')sY:number,@Query('eX')eX:number,@Query('eY')eY:number) {
  //   return this.pathService.findPubPath(sX,sY,eX,eY);
  // }

  // @Get('myBike')
  // findMyBikePath(@Query())

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.pathService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePathDto: UpdatePathDto) {
  //   return this.pathService.update(+id, updatePathDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.pathService.remove(+id);
  // }

  @Post()
  async filterDuplicatedRoute(
    @Body() filterDuplicatedRouteInput: FilterDuplicatedRouteInput,
  ): Promise<FilterDuplicatedRouteOutput> {
    return await this.pathService.filterDuplicatedRoute(
      filterDuplicatedRouteInput,
    );
  }
}
