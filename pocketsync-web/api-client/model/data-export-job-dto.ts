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
 * @interface DataExportJobDto
 */
export interface DataExportJobDto {
    /**
     * Unique identifier for the data export job
     * @type {string}
     * @memberof DataExportJobDto
     */
    'id': string;
    /**
     * Project identifier
     * @type {string}
     * @memberof DataExportJobDto
     */
    'projectId': string;
    /**
     * User identifier who requested the export
     * @type {string}
     * @memberof DataExportJobDto
     */
    'userId': string;
    /**
     * Status of the export job
     * @type {string}
     * @memberof DataExportJobDto
     */
    'status': DataExportJobDtoStatusEnum;
    /**
     * Filters applied to the export
     * @type {object}
     * @memberof DataExportJobDto
     */
    'filters': object;
    /**
     * Format of the export
     * @type {string}
     * @memberof DataExportJobDto
     */
    'formatType': DataExportJobDtoFormatTypeEnum;
    /**
     * When the export job was created
     * @type {string}
     * @memberof DataExportJobDto
     */
    'createdAt': string;
    /**
     * When the export job was completed
     * @type {string}
     * @memberof DataExportJobDto
     */
    'completedAt'?: string;
    /**
     * URL to download the exported data
     * @type {string}
     * @memberof DataExportJobDto
     */
    'downloadUrl'?: string;
    /**
     * When the download URL expires
     * @type {string}
     * @memberof DataExportJobDto
     */
    'expiresAt'?: string;
}

export const DataExportJobDtoStatusEnum = {
    Pending: 'PENDING',
    Processing: 'PROCESSING',
    Completed: 'COMPLETED',
    Failed: 'FAILED'
} as const;

export type DataExportJobDtoStatusEnum = typeof DataExportJobDtoStatusEnum[keyof typeof DataExportJobDtoStatusEnum];
export const DataExportJobDtoFormatTypeEnum = {
    Json: 'JSON',
    Csv: 'CSV',
    Excel: 'EXCEL'
} as const;

export type DataExportJobDtoFormatTypeEnum = typeof DataExportJobDtoFormatTypeEnum[keyof typeof DataExportJobDtoFormatTypeEnum];


