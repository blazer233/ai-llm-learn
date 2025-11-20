/**
 * API 服务层类型定义
 */

/**
 * 通用 API 响应格式
 */
export interface ApiResponse<T = any> {
  status: 'OK' | 'ERROR';
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页响应数据
 */
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 排序参数
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * 过滤参数
 */
export interface FilterParams {
  [key: string]: any;
}
