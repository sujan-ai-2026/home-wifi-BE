import { PaginationQueryDto } from '../../common/dto/pagination.dto';
export declare class AlertsQueryDto extends PaginationQueryDto {
    status?: string;
    metric?: string;
}
