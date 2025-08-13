//어울링 response도 정리해야
export class Point {
  //lon,lat만 입력하면 알아서 도로명 주소로 name 입력되고 key 없이 point type으로 입력됨
  lon: number;
  lat: number;
  name?: string;
  //POINT, PLACE, BUS_STOP
  poi_type?: string;
  //POINT면 지번 doc_id, PLACE면 confirmid, BUSSTOP이면 busstop_id
  key?: string;
}

export class FindPubPathInput {
  sPt: Point;
  ePt: Point;
  start_at?: string;
}

export class FindPubPathOutput {
  request: {
    pts: [Point & { route_type: string }, Point & { route_type: string }];
    platform: string;
    version: {
      major: number;
      minor: number;
      service: number;
      normalizeVersion: string;
      easyReadingFormat: string;
    };
    sort: string;
    start_at: string;
    is_day_off: boolean;
    is_close_soon: boolean;
    destination_reigions: {
      depth: number;
      id: string;
      name: string;
      simple_name: string;
    }[];
    maximum_results: number;
  };
  status: {
    code: string;
    error?: string;
  };
  incity?: {
    request_time: string;
    in_alarm_time: boolean;
    time_base: string;
    sort: string;
    routes: PubRoute[];
    taxi: {
      day_or_night: string;
      time: number;
      fare: number;
      distance: number;
    };
    log_key: string;
  };
  intercity?: any;
  open_tab: string;
}

export class PubRoute {
  type: string;
  ranking: number;
  fare?: { min: number; max: number };
  distance: {
    total: number;
  };
  time: {
    total: number;
    waiting: number;
    moving: number;
    walking: number;
    time_base: string;
    start_at: string;
    end_at: string;
  };
  running_state: string;
  interval_type: string;
  alarm_at_ride: boolean;
  transfer: number;
  steps: PubStep[];
  climate_card: boolean;
  river_bus: boolean;
}

export class PubStep {
  type: string;
  node: PubNode;
  time: { total: number; moving: number };
  stops?: PubNode[];
  bus?: PubBus;
  walk?: {
    distance: number;
    time: number;
    //end_node의 name과 busstopid이용해서 어디까지 걷기 이런 표시 하는데 사용
    end_node: PubNode;
    subway_transfer_type: string;
  };
  polylines?: PubPolyline[];
}

export class PubPolyline {
  pts: string;
  type: string;
  //버스 정류장에만 사용됨
  node_s?: {
    id: string;
  };
  //버스 정류장에만 사용됨
  node_e?: {
    id: string;
  };
}

export class PubNode {
  type?: string;
  id?: string;
  name: string;
  lon: number;
  lat: number;
  vehicle_time?: {
    arrival_at?: string;
    departure_at?: string;
  };
  busstop?: {
    display_id: string;
    realtime: boolean;
  };
}

export class PubBus {
  running_state: string;
  interval_type: string;
  buslines: PubBusline[];
  arrival: {
    vehicle_state_code2: number;
    remain_sec: number;
    busstop_count: number;
    seat_remain?: number;
    congestion: string;
    last: boolean;
    busline: {
      busline_id: string;
      name: string;
      subname?: string;
      simple_name?: string;
      type: string;
      subtype?: string;
    };
    bus_stop_order: number;
    bus_stop_idx: string;
  };
}

export class PubBusline {
  type: string;
  subtype: string;
  id: string;
  name: string;
  subname?: string;
  simple_name?: string;
  parent_id?: string;
  bus_stop_order: number;
  bust_stop_idx: string;
}

export class FindBikePathInput {
  pt: Point;
  ep: Point;
}

export class FindBikePathOutput {
  request: {
    pts: [Point & { route_type: string }, Point & { route_type: string }];
    version: {
      major: number;
      minor: number;
      service: number;
      normalizeVersion: string;
      easyReadingFormat: string;
    };
    speed_option: string;
    is_day_off: boolean;
    is_close_soon: boolean;
    destination_reigions: {
      depth: number;
      id: string;
      name: string;
      simple_name: string;
    }[];
    maximum_results: number;
  };
  status: {
    code: string;
    error?: string;
  };
  results: BikeResult[];
}

export class BikeResult {
  options: [string];
  success: boolean;
  time: number;
  length: number;
  calories: number;
  chart_data: BikeResultChartData;
  steps: BikeResultStep[];
  polylines: BikeResultPolyline[];
  facilities: {
    bridge: number;
    underground: number;
    stair: number;
    caution_section: {
      stair: number;
      crosswalk: number;
      bridge: number;
      tunnel: number;
      underpass: number;
      overpass: number;
      high_speed_road: number;
    };
  };
  road_type_distance: BikeResultRoadTypeDistance[];
}

export class BikeResultChartData {
  max_idx: number;
  max_val: number;
  min_idx: number;
  min_val: number;
  points: string;
  gradient_indices: number[];
  road_types: string[];
  ascent_distance: number;
  elavation_gain: number;
  elavation_loss: number;
  ascent_gradient: number;
}

export class BikeResultStep {
  pt_type?: string;
  name?: string;
  lon: number;
  lat: number;
  distance: number;
  icon_guide?: string;
  icon_road?: string;
  guidement?: string;
  roadview?: { panoid: string; pan: number; lon: number; lat: number }[];
  time: number;
  lane_count: number;
  rotation_angle: number;
  crossroad_rotation?: string;
  crossroad_rotation_clock: number;
  crossroad_rotation_order: number;
  guide_need: boolean;
}

export class BikeResultPolyline {
  pts: string;
  type: string;
  high?: string;
}

export class BikeResultRoadTypeDistance {
  road_type: string;
  distance: number;
}

export class FindWalkPathInput {
  pt: Point;
  ep: Point;
}

export class FindWalkPathOutput {
  request: {
    pts: [Point & { route_type: string }, Point & { route_type: string }];
    version: {
      major: number;
      minor: number;
      service: number;
      normalizeVersion: string;
      easyReadingFormat: string;
    };
    is_day_off: boolean;
    is_close_soon: boolean;
    destination_reigions: {
      depth: number;
      id: string;
      name: string;
      simple_name: string;
    }[];
    maximum_results: number;
  };
  status: {
    code: string;
  };
  results: WalkResult[];
}

export class WalkResult {
  options: [string];
  success: boolean;
  time: number;
  length: number;
  steps: WalkResultStep[];
  calories: number;
  facilites: { bridge: number; underground: number; stair: number };
  polylines: WalkResultPolyLine[];
}

export class WalkResultStep {
  pt_type?: string;
  name?: string;
  lon: number;
  lat: number;
  time: number;
  icon: number;
  icon_guide?: string;
  guidement?: string;
  roadview?: {
    panoid: string;
    pan: number;
    lon: number;
    lat: number;
  };
}

export class WalkResultPolyLine {
  pts: string;
  type: string;
}

export class FindMyBikePathsInput {
  sPt: Point;
  ePt: Point;
  start_at: string;
  bike_option: string;
}

export class FindMyBikePathsOutput {
  request: {
    pts: [Point & { route_type: string }, Point & { route_type: string }];
    sort: string;
    start_at: string;
  };
  status: {
    code: string;
    error?: string;
  };
  incity?: {
    sort: string;
    routes: WtwRoute[];
    log_key: string;
  };
}

//BikeResult는 route로 볼 것이 아니라 step으로 봐야함
export class WtwRoute {
  type: string;
  ranking: number;
  fare?: { min: number; max: number };
  //예를 들어 걷기 + 자전거 + 대중교통 이런식으로 직접 더하기
  distance: { total: number };
  time: {
    //각 방식 합산
    total: number;
    waiting: number;
    walking: number;
    //bikeResult의 time을 여기로 편입
    bike: number;
    //이건 상황별로 쓰면되고
    start_at: string;
    //pub이 마지막이면 pub 그대로 가져오고 자전거가 마지막이면 pub마지막 시간에 자전거 소요시간 계산해서 쓰기
    end_at: string;
  };
  running_state: string;
  transfer: number;
  steps: WtwStep[];
}

export class WtwStep {
  //bike를 치환한경우 BIKE로
  type: string;
  //각 단계 출발지점
  node?: PubNode;
  time: { total: number; moving: number };
  stops?: PubNode[];
  bus?: PubBus;
  walk?: {
    distance: number;
    time: number;
    end_node: PubNode;
    subway_transfer_type: string;
  };
  bike?: WtwBike;
  polylines?: WtwPolyline[];
}

//polylines는 한 단계 위로 뺌
export class WtwBike {
  options: [string];
  time: number;
  length: number;
  //BikeResultStep에서 필요한 속성만 넣자
  steps: WtwBikeStep[];
  facilities: {
    bridge: number;
    underground: number;
    stair: number;
    caution_section: {
      stair: number;
      crosswalk: number;
      bridge: number;
      tunnel: number;
      underpass: number;
      overpass: number;
      high_speed_road: number;
    };
  };
}

export class WtwBikeStep {
  pt_type?: string;
  name?: string;
  lon: number;
  lat: number;
  distance: number;
  icon_guide?: string;
  icon_road?: string;
  guidement?: string;
  time: number;
  lane_count: number;
  rotation_angle: number;
  crossroad_rotation?: string;
  crossroad_rotation_clock: number;
  crossroad_rotation_order: number;
  guide_need: boolean;
}

export class WtwPolyline {
  pts: string;
  type: string;
  node_s?: {
    id: string;
  };
  node_e?: {
    id: string;
  };
  high?: string;
}

// 이 위로 유효

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
