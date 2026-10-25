import { PaginationQueryDto } from '../../common/dto/pagination.dto';
export declare class DevicesQueryDto extends PaginationQueryDto {
    search?: string;
    isOnline?: boolean;
    connectionType?: 'wifi' | 'ethernet' | 'unknown';
    deviceType?: string;
    fromDate?: string;
    toDate?: string;
}
