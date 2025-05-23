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


import type { Configuration } from '../configuration';
import type { AxiosPromise, AxiosInstance, RawAxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from '../common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, type RequestArgs, BaseAPI, RequiredError, operationServerMap } from '../base';
// @ts-ignore
import type { SyncSessionDto } from '../model';
/**
 * SyncSessionsApi - axios parameter creator
 * @export
 */
export const SyncSessionsApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Get sync session by ID
         * @param {string} authorization JWT token
         * @param {string} id Sync session ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        syncSessionsControllerGetSessionById: async (authorization: string, id: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'authorization' is not null or undefined
            assertParamExists('syncSessionsControllerGetSessionById', 'authorization', authorization)
            // verify required parameter 'id' is not null or undefined
            assertParamExists('syncSessionsControllerGetSessionById', 'id', id)
            const localVarPath = `/sync-sessions/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            if (authorization != null) {
                localVarHeaderParameter['Authorization'] = String(authorization);
            }
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get sync sessions for a specific device
         * @param {string} authorization JWT token
         * @param {string} deviceId Device ID
         * @param {string} userIdentifier User identifier
         * @param {number} [limit] Number of sessions to return
         * @param {number} [offset] Number of sessions to skip
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        syncSessionsControllerGetSessionsByDevice: async (authorization: string, deviceId: string, userIdentifier: string, limit?: number, offset?: number, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'authorization' is not null or undefined
            assertParamExists('syncSessionsControllerGetSessionsByDevice', 'authorization', authorization)
            // verify required parameter 'deviceId' is not null or undefined
            assertParamExists('syncSessionsControllerGetSessionsByDevice', 'deviceId', deviceId)
            // verify required parameter 'userIdentifier' is not null or undefined
            assertParamExists('syncSessionsControllerGetSessionsByDevice', 'userIdentifier', userIdentifier)
            const localVarPath = `/sync-sessions/device/{deviceId}/user/{userIdentifier}`
                .replace(`{${"deviceId"}}`, encodeURIComponent(String(deviceId)))
                .replace(`{${"userIdentifier"}}`, encodeURIComponent(String(userIdentifier)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            if (authorization != null) {
                localVarHeaderParameter['Authorization'] = String(authorization);
            }
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get sync sessions for a specific project
         * @param {string} authorization JWT token
         * @param {string} projectId Project ID
         * @param {number} [limit] Number of sessions to return
         * @param {number} [offset] Number of sessions to skip
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        syncSessionsControllerGetSessionsByProject: async (authorization: string, projectId: string, limit?: number, offset?: number, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'authorization' is not null or undefined
            assertParamExists('syncSessionsControllerGetSessionsByProject', 'authorization', authorization)
            // verify required parameter 'projectId' is not null or undefined
            assertParamExists('syncSessionsControllerGetSessionsByProject', 'projectId', projectId)
            const localVarPath = `/sync-sessions/project/{projectId}`
                .replace(`{${"projectId"}}`, encodeURIComponent(String(projectId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            if (authorization != null) {
                localVarHeaderParameter['Authorization'] = String(authorization);
            }
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * SyncSessionsApi - functional programming interface
 * @export
 */
export const SyncSessionsApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = SyncSessionsApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Get sync session by ID
         * @param {string} authorization JWT token
         * @param {string} id Sync session ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async syncSessionsControllerGetSessionById(authorization: string, id: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<SyncSessionDto>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.syncSessionsControllerGetSessionById(authorization, id, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['SyncSessionsApi.syncSessionsControllerGetSessionById']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
        /**
         * 
         * @summary Get sync sessions for a specific device
         * @param {string} authorization JWT token
         * @param {string} deviceId Device ID
         * @param {string} userIdentifier User identifier
         * @param {number} [limit] Number of sessions to return
         * @param {number} [offset] Number of sessions to skip
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async syncSessionsControllerGetSessionsByDevice(authorization: string, deviceId: string, userIdentifier: string, limit?: number, offset?: number, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<SyncSessionDto>>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.syncSessionsControllerGetSessionsByDevice(authorization, deviceId, userIdentifier, limit, offset, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['SyncSessionsApi.syncSessionsControllerGetSessionsByDevice']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
        /**
         * 
         * @summary Get sync sessions for a specific project
         * @param {string} authorization JWT token
         * @param {string} projectId Project ID
         * @param {number} [limit] Number of sessions to return
         * @param {number} [offset] Number of sessions to skip
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async syncSessionsControllerGetSessionsByProject(authorization: string, projectId: string, limit?: number, offset?: number, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<SyncSessionDto>>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.syncSessionsControllerGetSessionsByProject(authorization, projectId, limit, offset, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['SyncSessionsApi.syncSessionsControllerGetSessionsByProject']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
    }
};

/**
 * SyncSessionsApi - factory interface
 * @export
 */
export const SyncSessionsApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = SyncSessionsApiFp(configuration)
    return {
        /**
         * 
         * @summary Get sync session by ID
         * @param {string} authorization JWT token
         * @param {string} id Sync session ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        syncSessionsControllerGetSessionById(authorization: string, id: string, options?: RawAxiosRequestConfig): AxiosPromise<SyncSessionDto> {
            return localVarFp.syncSessionsControllerGetSessionById(authorization, id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get sync sessions for a specific device
         * @param {string} authorization JWT token
         * @param {string} deviceId Device ID
         * @param {string} userIdentifier User identifier
         * @param {number} [limit] Number of sessions to return
         * @param {number} [offset] Number of sessions to skip
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        syncSessionsControllerGetSessionsByDevice(authorization: string, deviceId: string, userIdentifier: string, limit?: number, offset?: number, options?: RawAxiosRequestConfig): AxiosPromise<Array<SyncSessionDto>> {
            return localVarFp.syncSessionsControllerGetSessionsByDevice(authorization, deviceId, userIdentifier, limit, offset, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get sync sessions for a specific project
         * @param {string} authorization JWT token
         * @param {string} projectId Project ID
         * @param {number} [limit] Number of sessions to return
         * @param {number} [offset] Number of sessions to skip
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        syncSessionsControllerGetSessionsByProject(authorization: string, projectId: string, limit?: number, offset?: number, options?: RawAxiosRequestConfig): AxiosPromise<Array<SyncSessionDto>> {
            return localVarFp.syncSessionsControllerGetSessionsByProject(authorization, projectId, limit, offset, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * SyncSessionsApi - object-oriented interface
 * @export
 * @class SyncSessionsApi
 * @extends {BaseAPI}
 */
export class SyncSessionsApi extends BaseAPI {
    /**
     * 
     * @summary Get sync session by ID
     * @param {string} authorization JWT token
     * @param {string} id Sync session ID
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SyncSessionsApi
     */
    public syncSessionsControllerGetSessionById(authorization: string, id: string, options?: RawAxiosRequestConfig) {
        return SyncSessionsApiFp(this.configuration).syncSessionsControllerGetSessionById(authorization, id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get sync sessions for a specific device
     * @param {string} authorization JWT token
     * @param {string} deviceId Device ID
     * @param {string} userIdentifier User identifier
     * @param {number} [limit] Number of sessions to return
     * @param {number} [offset] Number of sessions to skip
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SyncSessionsApi
     */
    public syncSessionsControllerGetSessionsByDevice(authorization: string, deviceId: string, userIdentifier: string, limit?: number, offset?: number, options?: RawAxiosRequestConfig) {
        return SyncSessionsApiFp(this.configuration).syncSessionsControllerGetSessionsByDevice(authorization, deviceId, userIdentifier, limit, offset, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get sync sessions for a specific project
     * @param {string} authorization JWT token
     * @param {string} projectId Project ID
     * @param {number} [limit] Number of sessions to return
     * @param {number} [offset] Number of sessions to skip
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SyncSessionsApi
     */
    public syncSessionsControllerGetSessionsByProject(authorization: string, projectId: string, limit?: number, offset?: number, options?: RawAxiosRequestConfig) {
        return SyncSessionsApiFp(this.configuration).syncSessionsControllerGetSessionsByProject(authorization, projectId, limit, offset, options).then((request) => request(this.axios, this.basePath));
    }
}

