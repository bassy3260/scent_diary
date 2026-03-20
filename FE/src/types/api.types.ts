export interface BaseResponse {
  status: number;
  message: string;
}

export interface DataResponse<T> extends BaseResponse {
  data: T;
}
