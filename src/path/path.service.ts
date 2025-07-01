import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePathDto } from './dto/create-path.dto';
import { UpdatePathDto } from './dto/update-path.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BikePathOutput,
  PathInput,
  PubPathOutput,
  WalkPathOutput,
} from './dto/path.dto';

// .env 처리 필요

@Injectable()
export class PathService {
  constructor(private httpService: HttpService) {}
  create(createPathDto: CreatePathDto) {
    return 'This action adds a new path';
  }

  private calculateDistance(
    lng: number,
    lat: number,
    x: number,
    y: number,
  ): number {
    return Math.pow(lng - x, 2) + Math.pow(lat - y, 2);
  }

  async findSejongBike(lng: number, lat: number) {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`https://www.sejongbike.kr/api/v1/station/list/extra
  `),
      );
      if (response.status === 200) {
        const bikes: any[] = response.data.data.sbike_station;
        bikes.sort(
          (a, b) =>
            this.calculateDistance(lng, lat, a['x_pos'], a['y_pos']) -
            this.calculateDistance(lng, lat, b['x_pos'], b['y_pos']),
        );
        return bikes.filter((bike) => bike['bike_parking']).slice(0, 5);
      } else throw new InternalServerErrorException();
    } catch {
      throw new InternalServerErrorException('Cannot find sejong bikes');
    }
  }

  private async searchCoordByAddress(query: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`http://dapi.kakao.com/v2/local/search.json`, {
          headers: {
            Authorization: `KakaoAK f5e99b0d96edb86c08b31d262770f146`,
          },
          params: { query: `${query}` },
        }),
      );
      if (response.status === 200) return response.data;
      else throw new InternalServerErrorException();
    } catch {
      throw new InternalServerErrorException(`Cannot get coordination`);
    }
  }

  private async transCoordWSGToWCONGNAMUL(lng: number, lat: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://dapi.kakao.com/v2/local/geo/transcoord.json?x=${lng}&y=${lat}&input_coord=WGS84&output_coord=WCONGNAMUL]`,
          {
            headers: {
              Authorization: `KakaoAK f5e99b0d96edb86c08b31d262770f146`,
            },
          },
        ),
      );
      if (response.status === 200) return response.data.documents[0];
      else throw new InternalServerErrorException();
    } catch {
      throw new InternalServerErrorException('Cannot transform coordination');
    }
  }

  private async transCoordWCONGNAMULToWSG(x: number, y: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://dapi.kakao.com/v2/local/geo/transcoord.json?x=${x}&y=${y}&input_coord=WCONGNAMUL&output_coord=WSG84]`,
          {
            headers: {
              Authorization: `KakaoAK f5e99b0d96edb86c08b31d262770f146`,
            },
          },
        ),
      );
      if (response.status === 200) return response.data;
      else throw new InternalServerErrorException();
    } catch {
      throw new InternalServerErrorException('Cannot transform coordination');
    }
  }

  private async findPubPath({
    sX,
    sY,
    eX,
    eY,
  }: PathInput): Promise<PubPathOutput> {
    try {
      const timestamp = Date.now();
      const randomPart =
        Math.floor(Math.random() * 1e16).toString() +
        Math.floor(Math.random() * 1e4).toString();
      const response = await firstValueFrom(
        this.httpService.get(
          `https://map.kakao.com/route/pubtrans.json?inputCoordSystem=WCONGNAMUL&outputCoordSystem=WCONGNAMUL&service=map.daum.net&callback=jQuery${randomPart}_${timestamp}&sX=${sX}&sY=${sY}&eX=${eX}&eY=${eY}
`,
          { responseType: 'text' },
        ),
      );
      if (response.status === 200) {
        const startIdx = response.data.indexOf('(');
        const endIdx = response.data.lastIndexOf(')');
        const jsonStr = response.data.slice(startIdx + 1, endIdx);
        const data = JSON.parse(jsonStr);
        return data;
      } else throw new InternalServerErrorException();
    } catch {
      throw new InternalServerErrorException(
        `Cannot find public transportation paths`,
      );
    }
  }

  private async findBikePath({
    sX,
    sY,
    eX,
    eY,
  }: PathInput): Promise<BikePathOutput> {
    try {
      const timestamp = Date.now();
      const randomPart =
        Math.floor(Math.random() * 1e16).toString() +
        Math.floor(Math.random() * 1e4).toString();
      const response = await firstValueFrom(
        this.httpService.get(
          `https://map.kakao.com/route/bikeset.json?callback=jQuery${randomPart}_${timestamp}&sX=${sX}&sY=${sY}&eX=${eX}&eY=${eY}
`,
          { responseType: 'text' },
        ),
      );
      if (response.status === 200) {
        const startIdx = response.data.indexOf('(');
        const endIdx = response.data.lastIndexOf(')');
        const jsonStr = response.data.slice(startIdx + 1, endIdx);
        const data = JSON.parse(jsonStr);
        return data;
      } else throw new InternalServerErrorException();
    } catch {
      throw new InternalServerErrorException(`Cannot find bike paths`);
    }
  }

  private async findWalkPath({
    sX,
    sY,
    eX,
    eY,
  }: PathInput): Promise<WalkPathOutput> {
    try {
      const timestamp = Date.now();
      const randomPart =
        Math.floor(Math.random() * 1e16).toString() +
        Math.floor(Math.random() * 1e4).toString();
      const response = await firstValueFrom(
        this.httpService.get(
          `https://map.kakao.com/route/walkset.json?callback=jQuery${randomPart}_${timestamp}&sX=${sX}&sY=${sY}&eX=${eX}&eY=${eY}
`,
          { responseType: 'text' },
        ),
      );
      if (response.status === 200) {
        const startIdx = response.data.indexOf('(');
        const endIdx = response.data.lastIndexOf(')');
        const jsonStr = response.data.slice(startIdx + 1, endIdx);
        const data = JSON.parse(jsonStr);
        return data;
      } else throw new InternalServerErrorException();
    } catch {
      throw new InternalServerErrorException(`Cannot find walk paths`);
    }
  }

  //원래 pathOutput을 가지고 step에서 뭐 하나 빼고 summary 정리하고 이런식으로 하자
  //만약 구하는 값이 없는경우는 또 어떻게 처리하냐...
  async findMyBikePaths(
    isBikeAtStart: Boolean,
    isBikeAtEnd: Boolean,
    sLng: number,
    sLat: number,
    eLng: number,
    eLat: number,
  ) {
    try {
      const { x: sX, y: sY } = await this.transCoordWSGToWCONGNAMUL(sLng, sLat);
      const { x: eX, y: eY } = await this.transCoordWSGToWCONGNAMUL(eLng, eLat);
      const routes = (await this.findPubPath({ sX, sY, eX, eY })).in_local
        .routes;
      if (isBikeAtStart) {
        await Promise.all(
          routes.map(async (route) => {
            const firstStep = route.steps[1];
            if (!firstStep)
              throw new InternalServerErrorException('There is no first step');
            const firstStepTime = firstStep.time.value;
            if (firstStep.type === 'WALKING') {
              const secondStep = route.steps[2];
              if (!secondStep)
                throw new InternalServerErrorException(
                  'There is no second step',
                );
              const secondStepTime = secondStep.time.value;
              if (secondStep.type !== 'BUS' && firstStepTime > 360) {
                //치환o
                const bsX = firstStep.startLocation.x;
                const bsY = firstStep.startLocation.y;
                const beX = firstStep.endLocation.x;
                const beY = firstStep.endLocation.y;
                const bikePaths = await this.findBikePath({
                  sX: bsX,
                  sY: bsY,
                  eX: beX,
                  eY: beY,
                });
                await Promise.all(
                  bikePaths.directions.map(async (direction) => {
                    const lastSection =
                      direction.sections[direction.sections.length - 1];
                    const lastGuide =
                      lastSection.guideList[lastSection.guideList.length - 1];
                    if (beX !== lastGuide.x || beY !== lastGuide.y) {
                      const intermediateWalkPath = (
                        await this.findWalkPath({
                          sX: lastGuide.x,
                          sY: lastGuide.y,
                          eX: beX,
                          eY: beY,
                        })
                      ).directions[1];
                      //기존 route를 이제 변경할 차례인가??
                    }
                  }),
                );
              } else if (secondStep.type === 'BUS' && secondStepTime <= 600) {
                //치환o
              } else return;
            } else if (firstStep.type === 'BUS' && firstStepTime <= 600) {
              //치환o 위에서 사용한 알고리즘 private func로 만들어서 그대로 쓰자 생각해보니 조금 다를 수 있으니 개별 알고리즘 짜야할 듯
            }
          }),
        );
      }
    } catch (error) {
      if (
        error.message === 'There is no first step' ||
        error.message === 'There is no second step'
      )
        throw error;
      else throw new InternalServerErrorException('Cannot find my bike paths');
    }
  }

  async findSejongBikePaths(
    sLng: number,
    sLat: number,
    eLng: number,
    eLat: number,
  ) {
    try {
      const { x: sX, y: sY } = await this.transCoordWSGToWCONGNAMUL(sLng, sLat);
      const { x: eX, y: eY } = await this.transCoordWSGToWCONGNAMUL(eLng, eLat);
    } catch {}
  }

  findAll() {
    return `This action returns all path`;
  }

  findOne(id: number) {
    return `This action returns a #${id} path`;
  }

  update(id: number, updatePathDto: UpdatePathDto) {
    return `This action updates a #${id} path`;
  }

  remove(id: number) {
    return `This action removes a #${id} path`;
  }
}
