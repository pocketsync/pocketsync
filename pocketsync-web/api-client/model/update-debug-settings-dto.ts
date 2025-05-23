/* tslint:disable */
/* eslint-disable */
/**
 * PocketSync API
 * API documentation for PocketSync backend services
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



/**
 * 
 * @export
 * @interface UpdateDebugSettingsDto
 */
export interface UpdateDebugSettingsDto {
    /**
     * Log level for the project
     * @type {string}
     * @memberof UpdateDebugSettingsDto
     */
    'logLevel'?: UpdateDebugSettingsDtoLogLevelEnum;
    /**
     * Number of days to retain logs and metrics
     * @type {number}
     * @memberof UpdateDebugSettingsDto
     */
    'retentionDays'?: number;
    /**
     * Enable data diffing for changes
     * @type {boolean}
     * @memberof UpdateDebugSettingsDto
     */
    'enableDataDiffing'?: boolean;
    /**
     * Enable detailed logs
     * @type {boolean}
     * @memberof UpdateDebugSettingsDto
     */
    'enableDetailedLogs'?: boolean;
    /**
     * Enable metrics collection
     * @type {boolean}
     * @memberof UpdateDebugSettingsDto
     */
    'enableMetricsCollection'?: boolean;
    /**
     * Notify on error
     * @type {boolean}
     * @memberof UpdateDebugSettingsDto
     */
    'notifyOnError'?: boolean;
    /**
     * Notify on warning
     * @type {boolean}
     * @memberof UpdateDebugSettingsDto
     */
    'notifyOnWarning'?: boolean;
}

export const UpdateDebugSettingsDtoLogLevelEnum = {
    Info: 'INFO',
    Warning: 'WARNING',
    Error: 'ERROR',
    Debug: 'DEBUG'
} as const;

export type UpdateDebugSettingsDtoLogLevelEnum = typeof UpdateDebugSettingsDtoLogLevelEnum[keyof typeof UpdateDebugSettingsDtoLogLevelEnum];


