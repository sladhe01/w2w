import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(private httpService: HttpService) {}
  getHello(): string {
    return 'Hello World!';
  }

  calculateDistance(lng: number, lat: number, x: number, y: number) {
    return Math.pow(lng - x, 2) + Math.pow(lat - y, 2);
  }

  async getBikes(lng: number, lat: number) {
    const response = await firstValueFrom(
      this.httpService.get(`https://www.sejongbike.kr/api/v1/station/list/extra
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
  }
}
