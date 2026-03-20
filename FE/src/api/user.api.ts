import type { BaseResponse, DataResponse } from '../types/api.types';
import type { UpdateUserRequest, UserData } from '../types/user.types';
import { apiClient } from './client';

export type GetUserResponse = DataResponse<UserData>;
export type UpdateUserResponse = BaseResponse;
export type DeleteUserResponse = BaseResponse;

export const userApi = {
  getMe: () =>
    apiClient.get<GetUserResponse>('/api/v1/users/me'),

  updateMe: (body: UpdateUserRequest) =>
    apiClient.put<UpdateUserResponse>('/api/v1/users/me', body),

  deleteMe: () =>
    apiClient.delete<DeleteUserResponse>('/api/v1/users/me'),
};
