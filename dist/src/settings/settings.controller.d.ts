import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<import("./settings.service").AppSettingsResponse>;
    updateSettings(dto: UpdateSettingsDto): Promise<any>;
}
