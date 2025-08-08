import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePathDto } from './dto/create-path.dto';
import { UpdatePathDto } from './dto/update-path.dto';
import { HttpService } from '@nestjs/axios';
import { filter, firstValueFrom } from 'rxjs';
import {
  BikePathOutput,
  BikeSection,
  CoordToAddressOutput,
  FilterDuplicatedRouteInput,
  FilterDuplicatedRouteOutput,
  FindBikePathInput,
  FindBikePathOutput,
  FindMyBikePathsInput,
  FindPubPathInput,
  FindWalkPathInput,
  FindWalkPathOutput,
  PathInput,
  PubPathOutput,
  PubRoute,
  PubStep,
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

  //어울링 근거리 순으로 정리하기 위한 함수
  private calculateDistance(
    lon: number,
    lat: number,
    x: number,
    y: number,
  ): number {
    return Math.pow(lon - x, 2) + Math.pow(lat - y, 2);
  }

  //어울링 찾는 함수
  async findSejongBike(lon: number, lat: number) {
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
            this.calculateDistance(lon, lat, a['x_pos'], a['y_pos']) -
            this.calculateDistance(lon, lat, b['x_pos'], b['y_pos']),
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

  private async transCoordWSGToWCONGNAMUL(lon: number, lat: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://dapi.kakao.com/v2/local/geo/transcoord.json?x=${lon}&y=${lat}&input_coord=WGS84&output_coord=WCONGNAMUL]`,
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

  // app api 이용으로 노선 변경
  //   private async findPubPath({
  //     sX,
  //     sY,
  //     eX,
  //     eY,
  //   }: PathInput): Promise<PubPathOutput> {
  //     try {
  //       const timestamp = Date.now();
  //       const randomPart =
  //         Math.floor(Math.random() * 1e16).toString() +
  //         Math.floor(Math.random() * 1e4).toString();
  //       const response = await firstValueFrom(
  //         this.httpService.get(
  //           `https://map.kakao.com/route/pubtrans.json?inputCoordSystem=WCONGNAMUL&outputCoordSystem=WCONGNAMUL&service=map.daum.net&callback=jQuery${randomPart}_${timestamp}&sX=${sX}&sY=${sY}&eX=${eX}&eY=${eY}
  // `,
  //           { responseType: 'text' },
  //         ),
  //       );
  //       if (response.status === 200) {
  //         const startIdx = response.data.indexOf('(');
  //         const endIdx = response.data.lastIndexOf(')');
  //         const jsonStr = response.data.slice(startIdx + 1, endIdx);
  //         const data = JSON.parse(jsonStr);
  //         if (data.in_local_status === 'TOO_NEAR_POINTS')
  //           throw new Error('TOO NEAR POINTS');
  //         return data;
  //       } else throw new InternalServerErrorException();
  //     } catch (error) {
  //       if (error.message === 'TOO NEAR POINTS') throw error;
  //       else {
  //         throw new InternalServerErrorException(
  //           `Cannot find public transportation paths`,
  //         );
  //       }
  //     }
  //   }

  private async findPubPath({ sPt, ePt, start_at }: FindPubPathInput) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://app.map.kakao.com/route/pubtrans_v2.json?in_crs=EPSG%3A4326&out_crs=EPSG%3A4326&pt=${sPt.lon},${sPt.lat}${sPt.name ? `,${encodeURIComponent(sPt.name)},${sPt.poi_type},${sPt.key}` : ''}&pt=${ePt.lon},${ePt.lat},${ePt.name ? `,${encodeURIComponent(ePt.name)},${ePt.poi_type},${ePt.key}` : ''}&maximumResults=10${start_at ? `&start_at=${start_at}` : ''}&serviceName=kakaomap&lang=ko&mode=n&polyline_type=v2`,
        ),
      );
      if (response.status === 200) return response.data;
      else
        throw new InternalServerErrorException(
          `Cannot find public transportation paths`,
        );
    } catch (error) {
      if (error.message === 'TOO NEAR POINTS') throw error;
      else {
        throw new InternalServerErrorException(
          `Cannot find public transportation paths`,
        );
      }
    }
  }

  //   private async findBikePath({
  //     sX,
  //     sY,
  //     eX,
  //     eY,
  //   }: PathInput): Promise<BikePathOutput> {
  //     try {
  //       const timestamp = Date.now();
  //       const randomPart =
  //         Math.floor(Math.random() * 1e16).toString() +
  //         Math.floor(Math.random() * 1e4).toString();
  //       const response = await firstValueFrom(
  //         this.httpService.get(
  //           `https://map.kakao.com/route/bikeset.json?callback=jQuery${randomPart}_${timestamp}&sX=${sX}&sY=${sY}&eX=${eX}&eY=${eY}
  // `,
  //           { responseType: 'text' },
  //         ),
  //       );
  //       if (response.status === 200) {
  //         const startIdx = response.data.indexOf('(');
  //         const endIdx = response.data.lastIndexOf(')');
  //         const jsonStr = response.data.slice(startIdx + 1, endIdx);
  //         const data = JSON.parse(jsonStr);
  //         return data;
  //       } else throw new InternalServerErrorException();
  //     } catch {
  //       throw new InternalServerErrorException(`Cannot find bike paths`);
  //     }
  //   }

  private async findBikePath({
    pt,
    ep,
  }: FindBikePathInput): Promise<FindBikePathOutput> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://app.map.kakao.com/route/bikeset.json?in_crs=EPSG%3A4326&out_crs=EPSG%3A4326&pt=${pt.lon},${pt.lat}${pt.name ? `,${encodeURIComponent(pt.name)},${pt.poi_type},${pt.key}` : ''}&ep=${ep.lon},${ep.lat}${ep.name ? `,${encodeURIComponent(ep.name)},${ep.poi_type},${ep.key}` : ''}&speed_option=moderate&serviceName=kakaomap&lang=ko&mode=n`,
        ),
      );
      if (response.status === 200) return response.data;
      else throw new InternalServerErrorException(`Cannot find bike paths`);
    } catch (error) {
      throw new InternalServerErrorException(`Cannot find bike paths`);
    }
  }

  //   private async findWalkPath({
  //     sX,
  //     sY,
  //     eX,
  //     eY,
  //   }: PathInput): Promise<WalkPathOutput> {
  //     try {
  //       const timestamp = Date.now();
  //       const randomPart =
  //         Math.floor(Math.random() * 1e16).toString() +
  //         Math.floor(Math.random() * 1e4).toString();
  //       const response = await firstValueFrom(
  //         this.httpService.get(
  //           `https://map.kakao.com/route/walkset.json?callback=jQuery${randomPart}_${timestamp}&sX=${sX}&sY=${sY}&eX=${eX}&eY=${eY}
  // `,
  //           { responseType: 'text' },
  //         ),
  //       );
  //       if (response.status === 200) {
  //         const startIdx = response.data.indexOf('(');
  //         const endIdx = response.data.lastIndexOf(')');
  //         const jsonStr = response.data.slice(startIdx + 1, endIdx);
  //         const data = JSON.parse(jsonStr);
  //         return data;
  //       } else throw new InternalServerErrorException();
  //     } catch {
  //       throw new InternalServerErrorException(`Cannot find walk paths`);
  //     }
  //   }

  private async findWalkPath({
    pt,
    ep,
  }: FindWalkPathInput): Promise<FindWalkPathOutput> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://app.map.kakao.com/route/walkset.json?in_crs=EPSG%3A4326&out_crs=EPSG%3A4326&pt=${pt.lon},${pt.lat}${pt.name ? `,${encodeURIComponent(pt.name)},${pt.poi_type},${pt.key}` : ''}&ep=${ep.lon},${ep.lat}${ep.name ? `,${encodeURIComponent(ep.name)},${ep.poi_type},${ep.key}` : ''}&serviceName=kakaomap&lang=ko&mode=n`,
        ),
      );
      if (response.status === 200) return response.data;
      else throw new InternalServerErrorException(`Cannot find walk paths`);
    } catch {
      throw new InternalServerErrorException(`Cannot find walk paths`);
    }
  }

  //도보 길찾기 정보를 일반 길찾기 정보로 변환하는 함수 어울링 이용시 사용될 예정
  // private async walkGuidesToPubSteps() {}

  //치환할 steps를 bike 길찾기경로 찾은 후 step 형식으로 변환하여 반환
  // private async convertStepsTobikeStep(
  //   steps: Step[],
  //   mode: 'BIKE_ONLY' | 'SHORTEST' | 'ACCESSIBLE',
  // ): Promise<Step[]> {
  //   try {
  //     let bikeStep: Step;
  //     let blurredStep: Step | undefined;
  //     if (steps.length === 1) {
  //       const stepToConvert = steps[0];
  //       // 지하철은 아직 연구가 안되서 추가 안함
  //       if (stepToConvert.type === 'WALKING' || stepToConvert.type === 'BUS') {
  //         const startPoint = {
  //           x: stepToConvert.startLocation.x,
  //           y: stepToConvert.startLocation.y,
  //         };
  //         const endPoint = {
  //           x: stepToConvert.endLocation.x,
  //           y: stepToConvert.endLocation.y,
  //         };
  //         const bikePaths = await this.findBikePath({
  //           sX: startPoint.x,
  //           sY: startPoint.y,
  //           eX: endPoint.x,
  //           eY: endPoint.y,
  //         });
  //         //자전거도로 우선, 최단, 편안한 길에 따른 모드 변경
  //         let bikeSection: BikeSection;
  //         switch (mode) {
  //           case 'BIKE_ONLY':
  //             bikeSection = bikePaths.directions[0].sections[0];
  //             break;
  //           case 'SHORTEST':
  //             bikeSection = bikePaths.directions[1].sections[0];
  //             break;
  //           case 'ACCESSIBLE':
  //             bikeSection = bikePaths.directions[2].sections[0];
  //         }
  //         const bikeGuides = bikeSection.guideList;
  //         bikeStep.information =
  //           stepToConvert.information.split('까지') + ' 자전거로 이동';
  //         if (
  //           stepToConvert.type === 'WALKING' &&
  //           stepToConvert.time.value <= 360
  //         )
  //           bikeStep.information += ' (도보 이동 추천)';
  //         if (stepToConvert.type === 'BUS' && stepToConvert.time.value >= 600)
  //           bikeStep.information += ' (버스 이동 추천)';
  //         bikeStep.type = 'BIKE';
  //         bikeStep.action = 'MOVE';
  //         bikeStep.actionName = '이동';
  //         bikeStep.distance = {
  //           value: bikeSection.length,
  //           text: `${bikeSection.length}m`,
  //           html: `<b>${bikeSection.length}</b>m`,
  //         };
  //         bikeStep.time = {
  //           value: bikeSection.time,
  //           text: `${Math.round(bikeSection.time)}분`,
  //           html: `<b>${Math.round(bikeSection.time)}</b>분`,
  //         };
  //         bikeStep.startLocation = {
  //           name: stepToConvert.startLocation.name,
  //           x: stepToConvert.startLocation.x,
  //           y: stepToConvert.startLocation.y,
  //         };
  //         //원래 종착지가 버스 정류장인데 교통섬과 같은 경우 마지막 구간 blur로 나타내야함
  //         const lastGuide = bikeGuides[bikeGuides.length - 1];
  //         if (
  //           stepToConvert.endLocation.type === 'BUS' &&
  //           (stepToConvert.endLocation.x !== lastGuide.x ||
  //             stepToConvert.endLocation.y !== lastGuide.y)
  //         ) {
  //           blurredStep = {
  //             type: 'BLUR',
  //             polylineStart: { x: lastGuide.x, y: lastGuide.y },
  //             polylineEnd: {
  //               x: stepToConvert.endLocation.x,
  //               y: stepToConvert.endLocation.y,
  //             },
  //             polyline: `${Number(lastGuide.x)}|${Number(lastGuide.y)}|${Number(stepToConvert.endLocation.x)}|${Number(stepToConvert.endLocation.y)}`,
  //           };
  //         } else {
  //           bikeStep.endLocation = stepToConvert.endLocation;
  //         }
  //         bikeStep.polyline = '';
  //         await Promise.all(
  //           bikeGuides.map((guide, idx) => {
  //             if (idx === 0) {
  //               bikeStep.polyline += guide.link.points
  //                 .split('|')
  //                 .map((points) => {
  //                   const [x, y] = points.split(',');
  //                   return `${Number(x)}|${Number(y)}`;
  //                 })
  //                 .join('|');
  //             } else {
  //               bikeStep.polyline += guide.link.points
  //                 .split('|')
  //                 .map((points, pointsIdx) => {
  //                   if (pointsIdx !== 0) {
  //                     const [x, y] = points.split(',');
  //                     return `${Number(x)}|${Number(y)}`;
  //                   }
  //                 })
  //                 .join('|');
  //             }
  //           }),
  //         );
  //       }
  //     } else if (steps.length === 2) {
  //     }
  //     if (blurredStep) return [bikeStep, blurredStep];
  //     else return [bikeStep];
  //   } catch {}
  // }

  //원래 pathOutput을 가지고 step에서 뭐 하나 빼고 summary 정리하고 이런식으로 하자
  //만약 구하는 값이 없는경우는 또 어떻게 처리하냐...
  // async findMyBikePaths(
  //   isBikeAtStart: Boolean,
  //   isBikeAtEnd: Boolean,
  //   mode: 'BIKE_ONLY' | 'SHORTEST' | 'ACCESSIBLE',
  //   slon: number,
  //   sLat: number,
  //   elon: number,
  //   eLat: number,
  // ) {
  //   try {
  //     const { x: sX, y: sY } = await this.transCoordWSGToWCONGNAMUL(slon, sLat);
  //     const { x: eX, y: eY } = await this.transCoordWSGToWCONGNAMUL(elon, eLat);
  //     const routes = (await this.findPubPath({ sX, sY, eX, eY }))['in_local']
  //       .routes;
  //     if (isBikeAtStart) {
  //       await Promise.all(
  //         routes.map(async (route) => {
  //           const departureStep = route.steps[0];
  //           const firstStep = route.steps[1];
  //           if (!firstStep)
  //             throw new InternalServerErrorException('There is no first step');
  //           const firstStepTime = firstStep.time.value;
  //           //app api 통신으로 바꿔서 dto랑 싹 다 뜯어고치고 자전거가 정류장에 도착시 출발시간을 그 도착시간으로 정해서 다시 route 받아오게끔 해서 해야함
  //           //파싱도 안해도 될듯
  //           //경우의 수 생각해보자
  //           //1. 도 버 +(알파) 에서 도를 자로 변경 (버가 9분이상)
  //           // 도 버 버 + 알파일 때 도 버 더라도 버스가 빙 둘러 가면 9분이상이더라도 그냥 버스정류장까지 자전거 타는게 빠를 경우 있음
  //           //2. 버도 버 +(알파) 에서 버도를 자로 변경 (버가 9분이상)
  //           //3. 도버도 버+(알파) 에서 도버도를 자로 변경 (버가 9분이상)
  //           // 아 밑에 다시 작성해 그냥
  //           //도보, 버스 순서의 경우 도보를 자전거로 변경일 경우도 생각해봐야하고
  //           //버 도 경우도 생각해봐야함
  //           if (firstStep.type === 'WALKING') {
  //             const secondStep = route.steps[2];
  //             if (!secondStep)
  //               throw new InternalServerErrorException(
  //                 'There is no second step',
  //               );
  //             const secondStepTime = secondStep.time.value;
  //             if (secondStep.type !== 'BUS')
  //               throw new Error('DO NOT SUPPORT THIS TYPE SERVICE');
  //             // 이 밑으로는 다시 작성해야함
  //             let convertedSteps: Step[];
  //             if (secondStepTime > 540) {
  //               convertedSteps = await this.convertStepsTobikeStep(
  //                 [firstStep],
  //                 mode,
  //               );
  //               route.steps.splice(1, 1, ...convertedSteps);
  //             }
  //             // summary 같은거 더 정리해야함
  //             return route;
  //           } else if (firstStep.type === 'BUS' && firstStepTime <= 600) {
  //             //치환o 위에서 사용한 알고리즘 private func로 만들어서 그대로 쓰자 생각해보니 조금 다를 수 있으니 개별 알고리즘 짜야할 듯
  //           }
  //           // 이 위로 다시 작성해야 함
  //           /* 지나가지 못하는 곳에서 이동이 가능한 곳까지 폴리라인을 그리기 위함이니 나중에
  //           프론트에서 type이 Blur면 좌측에는 표시안하고 지도에만 blurred polyline 표시 해주면 됨*/
  //           if (
  //             departureStep.startLocation.x !== firstStep.polylineStart.x ||
  //             departureStep.startLocation.y !== firstStep.polylineStart.y
  //           ) {
  //             const blurredStep: Step = {
  //               type: 'BLUR',
  //               polylineStart: {
  //                 x: departureStep.startLocation.x,
  //                 y: departureStep.startLocation.y,
  //               },
  //               polylineEnd: {
  //                 x: firstStep.polylineStart.x,
  //                 y: firstStep.polylineStart.y,
  //               },
  //               polyline: `${Number(departureStep.polylineStart.x)}|${Number(departureStep.polylineStart.y)}|${Number(departureStep.polylineEnd.x)}|${Number(departureStep.polylineEnd.y)}}`,
  //             };
  //             route.steps.splice(1, 0, blurredStep);
  //           }
  //         }),
  //       );
  //     }
  //   } catch (error) {
  //     if (
  //       error.message === 'There is no first step' ||
  //       error.message === 'There is no second step' ||
  //       error.message === 'TOO NEAR POINTS'
  //     )
  //       throw error(`${error.message} SO YOU DO NOT NEED TO USE THIS SERVICE`);
  //     else if (error.message === 'DO NOT SUPPORT THIS TYPE SERVICE')
  //       throw error;
  //     else throw new InternalServerErrorException('Cannot find my bike paths');
  //   }
  // }

  //자전거 길찾기 결과를 step으로 전환하는 함수
  //자전거 단계 하나하나는 전체 요약에선 하나의 단계로 표현되고 클릭했을 때 드롭다운형식으로 구체적으로 나오도록 할 것
  async transBikeResultToWtwStep() {}

  async filterDuplicatedRoute({
    routes,
  }: FilterDuplicatedRouteInput): Promise<FilterDuplicatedRouteOutput> {
    /*
    만약 205번타고 B5 타기와 도보+B5 타기가 있으면 자전거 치환후에 같아 지는데 이를 어떻게 필터링 할까
    -> 우선 치환 전에 rotue.transfer가 0인 route의 steps에서 step.type==="BUS"인 것의 step.node.type==="BUSSTOP"의 route.step.node.id(예시)와 route.rank를 하나의 Array에 모아둔다.
    route.transfer가 0이 아닌경우 step.type==="BUS"인 두번째 step의 step.node.type==="BUSSTOP"인것 확인하고 route.step.node.id와 route.rank를 하나의 array에 push한다.
    여기서 route.step.node.id가 같은 것이 있으면 하나를 전체 결과에서 제외한다.
    */
    const filteredRoutes: PubRoute[] = [];
    const nodeSet = new Set<string>();

    for (const route of routes) {
      if (route.type !== 'BUS') {
        filteredRoutes.push(route);
        continue;
      }
      let cnt = 0;
      const targetCnt = route.transfer === 0 ? 0 : 1;
      for (const step of route.steps) {
        if (step.type === 'BUS' && step.node.type === 'BUSSTOP') {
          if (cnt === targetCnt) {
            if (!nodeSet.has(step.node.id)) {
              nodeSet.add(step.node.id);
              filteredRoutes.push(route);
            }
            break;
          } else if (cnt < targetCnt) cnt++;
        }
      }
    }
    // console.log(routes.length, filteredRoutes.length);
    return { routes: filteredRoutes };
  }

  async findMyBikePaths({ sPt, ePt, start_at }: FindMyBikePathsInput) {
    /*
    출발지, 목적지, 자전거 탑승지 인자로 받는다
    일반 대중교통 길찾기로 경로 전달 받은 후 치환한다.
    #만약 205번타고 B5 타기와 도보+B5 타기가 있으면 자전거 치환후에 같아 지는데 이를 어떻게 필터링 할까
    -> 우선 치환 전에 rotue.transfer가 0인 route의 steps에서 step.type==="BUS"인 것의 step.node.type==="BUSSTOP"의 route.step.node.id(예시)와 route.rank를 하나의 Array에 모아둔다.
    route.transfer가 0이 아닌경우 step.type==="BUS"인 두번째 step의 step.node.type==="BUSSTOP"인것 확인하고 route.step.node.id와 route.rank를 하나의 array에 push한다.
    여기서 route.step.node.id가 같은 것이 있으면 하나를 전체 결과에서 제외한다.
    #만약 시작점에서 자전거를 탑승하러 가야하는 경우 그 도보 루트도 구해주는 기능 추가하면 좋을 듯
    #모든 결과에서 출발지에서부터 도착지까지 자전거로만 이동거리가 3km 안이면 자전거로만 가는 것 추천 메모 붙여주기
    #치환 할 때 버스 구간은 정류장 끼리만 시간 지정으로 path 구해서 끼워 넣기
    #출발시간, 도착시간, 버스 정류장 남은시간 등등 손봐야 완벽할 것

    치환 기준은?

    A. 시작점에서 자전거를 타고 후에 버스를 타는 경우
    1. 도보 - 버스 - 도착 or 도보 - 버스 - 도보 - 도착인 경우
    # route.transfer===0 && route.steps[1].type==="WALKING"인 것으로 확인
    도보를 무조건 자전거로 치환
    2-1. 도보 - 버스 - 버스(+⍺)인 경우
    # route.transfer!==0 && route.steps[1].type==="WALKING"인 것으로 확인
    도보+첫번째 버스 구간을 자전거 path로 구해본 뒤 이동거리가 3km까지는 자전거로 치환 3km 넘어가면 도보만 치환
    2-2. 버스 - 버스(+⍺)인 경우
    # route.transfer!==0 && route.steps[1].type==="BUS"인 것으로 확인
    첫번째 버스 구간을 자전거 path로 구해본 뒤 이동거리가 3km까지는 자전거로 치환 3km 넘어가면 자전거 비추천 메시지 띄우고 다른 길찾기 서비스 권유
    

    B. 버스 내리고 자전거 타서 도착지로 가는 경우
    # 자전거를 탑승하는 곳이 정해져 있으니 일반 길찾기로 목적지를 자전거 탑승지로 지정하면 되니까 그닥 효용성이 없어보임 그래서 버스 정류장까지 탑승하고 가는 경우만 안내한다고 미리 고지 해야할 듯
    */
    try {
      const pubPath = this.findPubPath({ sPt, ePt, start_at });
    } catch (e) {}
  }

  async findSejongBikePaths(
    slon: number,
    sLat: number,
    elon: number,
    eLat: number,
  ) {
    /*
    출발지, 목적지만 인자로 받는다
    먼저 일반 대중교통 길찾기로 경로 전달 받아서 치환한다.
    #만약 205번타고 B5 타기와 도보+B5 타기가 있으면 자전거 치환후에 같아 지는데 이를 어떻게 필터링 할까
    -> 우선 치환 전에 rotue.transfer가 0인 route의 steps에서 step.type==="BUS"인 것의 step.node.type==="BUSSTOP"의 route.step.node.id(예시)와 route.rank를 하나의 Array에 모아둔다.
    route.transfer가 0이 아닌경우 step.type==="BUS"인 두번째 step의 step.node.type==="BUSSTOP"인것 확인하고 route.step.node.id와 route.rank를 하나의 array에 push한다.
    여기서 route.step.node.id가 같은 것이 있으면 하나를 전체 결과에서 제외한다.
    #치환 할 때 버스 구간은 정류장 끼리만 시간 지정으로 path 구해서 끼워 넣기
    #출발시간, 도착시간, 버스 정류장 남은시간 등등 손봐야 완벽할 것
    #출발지부터 목적지까지 공유자전거로만 이동 거리가 3km 이내라면 이 루트도 추가로 안내
    
    치환 기준은?
    #A 도보가 5분 이상인 구간의 경우 (자전거 대여소까지 도보 + 내리는 자전거 대여소까지 자전거로 탑승 + 도보로 원래 목적지까지)의 시간 합이 더 적으면 치환할 것
    #A 대여소에 탑승가능한 자전거가 존재할 경우만 안내
    #마지막 도착 전 도보 구간에 #A 적용할 것

    1. 도보 - 버스 - 도착 or 도보 - 버스 - 도보 - 도착인 경우
    # route.transfer===0 && route.steps[1].type==="WALKING"인 것으로 확인
    치환기준 #A에 따라 도보 구간 공유자전거로 치환할 것
    2. 버스 환승하는 경우
    # 환승간에 도보로 이동하는 경우 그 경우에도 #A 적용해볼 것 
    2-1. 도보 - 버스 - 버스(+⍺)인 경우
    첫 도보 - 버스 구간을 #A적용 해서 총 이동구간이 3km 안이면 치환 아니면 도보만 #A적용해서 치환
    2-2. 버스 - 버스(+⍺)인 경우
    # route.transfer!==0 && route.steps[1].type==="BUS"인 것으로 확인    
    첫번째 버스 구간을 자전거 path로 구해본 뒤 이동거리가 3km까지는 자전거로 치환 3km 넘어가면 rank를 낮춰서 맨아래 띄우고 비추천 경로로 안내할 것

    */
    try {
      const { x: sX, y: sY } = await this.transCoordWSGToWCONGNAMUL(slon, sLat);
      const { x: eX, y: eY } = await this.transCoordWSGToWCONGNAMUL(elon, eLat);
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
