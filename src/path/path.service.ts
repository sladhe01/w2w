import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePathDto } from './dto/create-path.dto';
import { UpdatePathDto } from './dto/update-path.dto';
import { HttpService } from '@nestjs/axios';
import { first, firstValueFrom } from 'rxjs';

@Injectable()
export class PathService {
  constructor(private httpService: HttpService) {}
  create(createPathDto: CreatePathDto) {
    return 'This action adds a new path';
  }

  private calculateDistance(lng: number, lat: number, x: number, y: number) {
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

  private async compareBikeWithWalking() {}

  async findPubPath(sX: number, sY: number, eX: number, eY: number) {
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

  async findBikePath(sX: number, sY: number, eX: number, eY: number) {
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

  async findMyBikePaths(
    sLng: number,
    sLat: number,
    eLng: number,
    eLat: number,
  ) {
    try {
      const { x: sX, y: sY } = await this.transCoordWSGToWCONGNAMUL(sLng, sLat);
      const { x: eX, y: eY } = await this.transCoordWSGToWCONGNAMUL(eLng, eLat);
      const routes: any[] = await this.findPubTransPath(sX, sY, eX, eY)[
        'in_local'
      ]['routes'];
      //걷기랑 자전거타기 비교해서 자전거 타는게 오래걸리면 그냥 걷는거 추천하면서 카카오맵으로 링크 건내주기?
      routes.forEach((route) => {
        if (route['steps'][1]['type'] === 'WALKING') {
        }
      });
    } catch {}
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
