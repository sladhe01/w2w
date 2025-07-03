import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePathDto } from './dto/create-path.dto';
import { UpdatePathDto } from './dto/update-path.dto';
import { HttpService } from '@nestjs/axios';
import { first, firstValueFrom, last } from 'rxjs';
import {
  BikePathOutput,
  BikeSection,
  CoordToAddressOutput,
  PathInput,
  PubPathOutput,
  SearchCoordByAddressOutput,
  Step,
  WalkPathOutput,
  WalkSection,
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

  private async searchCoordByAddress(
    query: string,
  ): Promise<SearchCoordByAddressOutput> {
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

  private async coordToAddress(
    x: string,
    y: string,
    input_coord: string,
  ): Promise<CoordToAddressOutput> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `http://dapi.kakao.com/v2/local/geo/coord2address.json`,
          {
            headers: {
              Authorization: `KakaoAK f5e99b0d96edb86c08b31d262770f146`,
            },
            params: { x: `${x}`, y: `${y}`, input_coord: `${input_coord}` },
          },
        ),
      );
      if (response.status === 200) return response.data;
      else throw new InternalServerErrorException();
    } catch {
      throw new InternalServerErrorException(
        `Cannot get address by coordination`,
      );
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

  //searchCoord 함수로 다른 변수도 넣을 수 있을듯
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
        if (data.in_local_status === 'TOO_NEAR_POINTS')
          throw new Error('TOO NEAR POINTS');
        return data;
      } else throw new InternalServerErrorException();
    } catch (error) {
      if (error.message === 'TOO NEAR POINTS') throw error;
      else {
        throw new InternalServerErrorException(
          `Cannot find public transportation paths`,
        );
      }
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

  //도보 길찾기 정보를 일반 길찾기 정보로 변환하는 함수 어울링 이용시 사용될 예정
  private async walkGuidesToPubSteps() {}

  //치환할 steps를 bike 길찾기경로 찾은 후 step 형식으로 변환하여 반환
  private async convertStepsTobikeStep(
    steps: Step[],
    mode: 'BIKE_ONLY' | 'SHORTEST' | 'ACCESSIBLE',
  ): Promise<Step[]> {
    try {
      let bikeStep: Step;
      let blurredStep: Step | undefined;
      if (steps.length === 1) {
        const stepToConvert = steps[0];
        // 지하철은 아직 연구가 안되서 추가 안함
        if (stepToConvert.type === 'WALKING' || stepToConvert.type === 'BUS') {
          const startPoint = {
            x: stepToConvert.startLocation.x,
            y: stepToConvert.startLocation.y,
          };
          const endPoint = {
            x: stepToConvert.endLocation.x,
            y: stepToConvert.endLocation.y,
          };
          const bikePaths = await this.findBikePath({
            sX: startPoint.x,
            sY: startPoint.y,
            eX: endPoint.x,
            eY: endPoint.y,
          });
          //자전거도로 우선, 최단, 편안한 길에 따른 모드 변경
          let bikeSection: BikeSection;
          switch (mode) {
            case 'BIKE_ONLY':
              bikeSection = bikePaths.directions[0].sections[0];
              break;
            case 'SHORTEST':
              bikeSection = bikePaths.directions[1].sections[0];
              break;
            case 'ACCESSIBLE':
              bikeSection = bikePaths.directions[2].sections[0];
          }
          const bikeGuides = bikeSection.guideList;
          bikeStep.information =
            stepToConvert.information.split('까지') + ' 자전거로 이동';
          if (
            stepToConvert.type === 'WALKING' &&
            stepToConvert.time.value <= 360
          )
            bikeStep.information += ' (도보 이동 추천)';
          if (stepToConvert.type === 'BUS' && stepToConvert.time.value >= 600)
            bikeStep.information += ' (버스 이동 추천)';
          bikeStep.type = 'BIKE';
          bikeStep.action = 'MOVE';
          bikeStep.actionName = '이동';
          bikeStep.distance = {
            value: bikeSection.length,
            text: `${bikeSection.length}m`,
            html: `<b>${bikeSection.length}</b>m`,
          };
          bikeStep.time = {
            value: bikeSection.time,
            text: `${Math.round(bikeSection.time)}분`,
            html: `<b>${Math.round(bikeSection.time)}</b>분`,
          };
          bikeStep.startLocation = {
            name: stepToConvert.startLocation.name,
            x: stepToConvert.startLocation.x,
            y: stepToConvert.startLocation.y,
          };
          //원래 종착지가 버스 정류장인데 교통섬과 같은 경우 마지막 구간 blur로 나타내야함
          const lastGuide = bikeGuides[bikeGuides.length - 1];
          if (
            stepToConvert.endLocation.type === 'BUS' &&
            (stepToConvert.endLocation.x !== lastGuide.x ||
              stepToConvert.endLocation.y !== lastGuide.y)
          ) {
            blurredStep = {
              type: 'BLUR',
              polylineStart: { x: lastGuide.x, y: lastGuide.y },
              polylineEnd: {
                x: stepToConvert.endLocation.x,
                y: stepToConvert.endLocation.y,
              },
              polyline: `${Number(lastGuide.x)}|${Number(lastGuide.y)}|${Number(stepToConvert.endLocation.x)}|${Number(stepToConvert.endLocation.y)}`,
            };
          } else {
            bikeStep.endLocation = stepToConvert.endLocation;
          }
          bikeStep.polyline = '';
          await Promise.all(
            bikeGuides.map((guide, idx) => {
              if (idx === 0) {
                bikeStep.polyline += guide.link.points
                  .split('|')
                  .map((points) => {
                    const [x, y] = points.split(',');
                    return `${Number(x)}|${Number(y)}`;
                  })
                  .join('|');
              } else {
                bikeStep.polyline += guide.link.points
                  .split('|')
                  .map((points, pointsIdx) => {
                    if (pointsIdx !== 0) {
                      const [x, y] = points.split(',');
                      return `${Number(x)}|${Number(y)}`;
                    }
                  })
                  .join('|');
              }
            }),
          );
        }
      } else if (steps.length === 2) {
      }
      if (blurredStep) return [bikeStep, blurredStep];
      else return [bikeStep];
    } catch {}
  }

  //원래 pathOutput을 가지고 step에서 뭐 하나 빼고 summary 정리하고 이런식으로 하자
  //만약 구하는 값이 없는경우는 또 어떻게 처리하냐...
  async findMyBikePaths(
    isBikeAtStart: Boolean,
    isBikeAtEnd: Boolean,
    mode: 'BIKE_ONLY' | 'SHORTEST' | 'ACCESSIBLE',
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
            const departureStep = route.steps[0];
            const firstStep = route.steps[1];
            if (!firstStep)
              throw new InternalServerErrorException('There is no first step');
            const firstStepTime = firstStep.time.value;
            //도보, 버스 순서의 경우 도보를 자전거로 변경
            if (firstStep.type === 'WALKING') {
              const secondStep = route.steps[2];
              if (!secondStep)
                throw new InternalServerErrorException(
                  'There is no second step',
                );
              const secondStepTime = secondStep.time.value;
              if (secondStep.type !== 'BUS')
                throw new Error('DO NOT SUPPORT THIS TYPE SERVICE');
              // 이 밑으로는 다시 작성해야함
              let convertedSteps: Step[];
              if (secondStepTime > 540) {
                convertedSteps = await this.convertStepsTobikeStep(
                  [firstStep],
                  mode,
                );
                route.steps.splice(1, 1, ...convertedSteps);
              }
              // summary 같은거 더 정리해야함
              return route;
            } else if (firstStep.type === 'BUS' && firstStepTime <= 600) {
              //치환o 위에서 사용한 알고리즘 private func로 만들어서 그대로 쓰자 생각해보니 조금 다를 수 있으니 개별 알고리즘 짜야할 듯
            }
            // 이 위로 다시 작성해야 함
            /* 지나가지 못하는 곳에서 이동이 가능한 곳까지 폴리라인을 그리기 위함이니 나중에
            프론트에서 type이 Blur면 좌측에는 표시안하고 지도에만 blurred polyline 표시 해주면 됨*/
            if (
              departureStep.startLocation.x !== firstStep.polylineStart.x ||
              departureStep.startLocation.y !== firstStep.polylineStart.y
            ) {
              const blurredStep: Step = {
                type: 'BLUR',
                polylineStart: {
                  x: departureStep.startLocation.x,
                  y: departureStep.startLocation.y,
                },
                polylineEnd: {
                  x: firstStep.polylineStart.x,
                  y: firstStep.polylineStart.y,
                },
                polyline: `${Number(departureStep.polylineStart.x)}|${Number(departureStep.polylineStart.y)}|${Number(departureStep.polylineEnd.x)}|${Number(departureStep.polylineEnd.y)}}`,
              };
              route.steps.splice(1, 0, blurredStep);
            }
          }),
        );
      }
    } catch (error) {
      if (
        error.message === 'There is no first step' ||
        error.message === 'There is no second step' ||
        error.message === 'TOO NEAR POINTS'
      )
        throw error(`${error.message} SO YOU DO NOT NEED TO USE THIS SERVICE`);
      else if (error.message === 'DO NOT SUPPORT THIS TYPE SERVICE')
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
