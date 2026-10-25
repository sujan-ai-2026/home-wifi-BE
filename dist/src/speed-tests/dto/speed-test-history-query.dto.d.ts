import { PaginationQueryDto } from '../../common/dto/pagination.dto';
export declare class SpeedTestHistoryQueryDto extends PaginationQueryDto {
    from?: string;
    to?: string;
    status?: 'success' | 'failed';
}
