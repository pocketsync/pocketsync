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
 * @interface DeviceChangeDto
 */
export interface DeviceChangeDto {
    /**
     * Unique identifier for the device change
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'id': string;
    /**
     * Change identifier
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'changeId': string;
    /**
     * Project identifier
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'projectId': string;
    /**
     * User identifier
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'userIdentifier': string;
    /**
     * Device identifier
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'deviceId': string;
    /**
     * Type of change (CREATE, UPDATE, DELETE)
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'changeType': string;
    /**
     * Name of the table being changed
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'tableName': string;
    /**
     * ID of the record being changed
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'recordId': string;
    /**
     * Change data (JSON)
     * @type {object}
     * @memberof DeviceChangeDto
     */
    'data': object;
    /**
     * Timestamp when the change was made on the client
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'clientTimestamp': string;
    /**
     * Client version number
     * @type {number}
     * @memberof DeviceChangeDto
     */
    'clientVersion': number;
    /**
     * Timestamp when the change was created on the server
     * @type {string}
     * @memberof DeviceChangeDto
     */
    'createdAt': string;
    /**
     * Timestamp when the change was deleted (if applicable)
     * @type {object}
     * @memberof DeviceChangeDto
     */
    'deletedAt': object;
    /**
     * Sync session identifier (if applicable)
     * @type {object}
     * @memberof DeviceChangeDto
     */
    'syncSessionId': object;
}

