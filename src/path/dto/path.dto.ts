//어울링 response도 정리해야

export class PathInput {
  sX: number;
  sY: number;
  eX: number;
  eY: number;
}

export class DisplayValue {
  value?: number;
  text?: string;
  html?: string;
}

export class Location {
  type?: string;
  id?: string;
  name?: string;
  action?: string;
  actionName?: string;
  x?: number;
  y?: number;
  roadView?: unknown;
  realTime?: boolean;
  displayId?: string;
}

export class Vehicle {
  type?: string;
  id?: string;
  subType?: string;
  subTypeName?: string;
  name?: string;
  name1?: string;
  name2?: string;
  visible?: boolean;
  parentId?: string;
  runningCountPerHour?: number;
  runningTimeGrade?: string;
  startOrder?: number;
  idx?: string;
}

export class BusArrival {
  busId?: string;
  busName?: string;
  busType?: string;
  direction?: string;
  order?: number;
  remainSeat?: number;
  congestion?: string;
  arrivalTime?: number;
  busStopCount?: number;
  vehicleNumber?: string;
  vehicleState?: number;
  lastVehicle?: boolean;
  firstVehicle?: boolean;
}

export class Summary {
  information?: string;
  startLocation?: Location;
  endLocation?: Location;
  vehicles?: Vehicle[];
  busArrivals?: BusArrival[];
  intervalCost?: number;
}

export class PolyLine {
  x?: number;
  y?: number;
}

export class ExpectedTime {
  passable?: true;
  firstTime?: string;
  lastTime?: string;
  managerType?: number;
  nextFirstTime?: string;
  nextLastTime?: string;
}

export class Step {
  information?: string;
  type?: string;
  action?: string;
  actionName?: string;
  distance?: DisplayValue;
  time?: DisplayValue;
  startLocation?: Location;
  endLocation?: Location;
  nodes?: Location[];
  vehecles?: Vehicle[];
  polylineStart?: PolyLine;
  polylineEnd?: PolyLine;
  polyline?: string;
  riverBus?: boolean;
  climateCard?: boolean;
  intervalCost?: number;
  expectedTime?: ExpectedTime;
  subwayElavator?: boolean;
  walkingGuide?: boolean;
}

export class PubPathRoute {
  ranking?: number;
  type?: string;
  distance?: DisplayValue;
  time?: DisplayValue;
  walkingDistance?: DisplayValue;
  transfers?: number;
  fare?: DisplayValue;
  boundary?: {
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
  };
  recommended?: boolean;
  shortestTime?: boolean;
  leastTransfer?: boolean;
  riverBus?: boolean;
  climateCard?: boolean;
  expectedTime?: ExpectedTime;
  summaries?: Summary[];
  steps?: Step[];
}

export class PubPathOutput {
  in_local_status?: string;
  inter_local_status?: string;
  inter_local?: unknown;
  in_local?: {
    status?: string;
    start?: {
      x?: number;
      y?: number;
      code?: string;
      region?: string;
      name?: string;
      confirmId?: string;
    };
    end?: {
      x?: number;
      y?: number;
      code?: string;
      region?: string;
      name?: string;
      confirmId?: string;
    };
    numberOfRoutes?: {
      total?: number;
      bus?: number;
      subway?: number;
      busAndSubway?: number;
    };
    routes?: PubPathRoute[];
  };
}

export class Guide {
  groupId?: string;
  seq?: number;
  guideCode?: string;
  rotationCode?: string;
  categoryCode?: string;
  x?: number;
  y?: number;
  roadName?: string;
  guideMent?: string;
  link?: {
    time?: number;
    length?: number;
    existCenterLine?: boolean;
    points?: string;
    minGradient?: number;
    maxGradient?: number;
    gradiendtCode?: string;
  };
  roadView?: unknown;
}

export class Bound {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export class BikeSection {
  resultCode?: string;
  time?: number;
  length?: number;
  calories?: string;
  guideList?: Guide[];
}

export class BikeDirection {
  routeMode?: string;
  routeType?: string;
  time?: number;
  length?: number;
  bound?: Bound;
  resultCode?: string;
  sections?: BikeSection[];
  gradientChart?: unknown;
}

export class BikePathOutput {
  resultCode?: string;
  directions?: BikeDirection[];
  bound?: Bound;
}

export class WalkSection {
  guideList?: Guide[];
  resultCode?: string;
  length?: number;
  calories?: string;
  time?: number;
  facilites?: {
    stair?: number;
    underground?: number;
    bridge?: number;
  };
}

export class WalkDirection {
  routeMode?: string;
  bound?: Bound;
  resultCode?: string;
  length: number;
  time?: number;
  sections?: WalkSection[];
  groupInfoMap?: unknown;
}

export class WalkPathOutput {
  directions?: WalkDirection[];
  bound?: Bound;
  resultCode?: string;
}

export class SearchCoordByAddressMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
}

export class Address {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  region_3depth_h_name: string;
  h_code: string;
  b_code: string;
  moutain_yn: string;
  main_address_no: string;
  sub_address_no: string;
  x: string;
  y: string;
}

export class RoadAddress {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  road_name: string;
  underground_yn: string;
  main_building_no: string;
  sub_building_no: string;
  building_name: string;
  zone_no: string;
  x: string;
  y: string;
}

export class SearchCoordByAddressDocument {
  address_name: string;
  address_type: string;
  x: string;
  y: string;
  address: Address;
  road_address: RoadAddress;
}

export class SearchCoordByAddressOutput {
  meta: SearchCoordByAddressMeta;
  documents: SearchCoordByAddressDocument[];
}

export class CoordToAddressMeta {
  total_count: number;
}

export class CoordToAddresDocument {
  address: Omit<Address, 'h_code' | 'b_code' | 'x' | 'y'>;
  road_address: Omit<RoadAddress, 'x' | 'y'>;
}

export class CoordToAddressOutput {
  meta: CoordToAddressMeta;
  documents: CoordToAddresDocument[];
}
