import { Type } from 'class-transformer';
import { IsArray, IsInt, IsBoolean, ValidateNested } from 'class-validator';
import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export class PaginatedResponse<T> {
    data: Array<T>;
    total: number;
    currentPage: number;
    totalPages: number;
}

export const OpenApiPaginationResponse = (model: any) => {
    return applyDecorators(
        ApiOkResponse({
            schema: {
                properties: {
                    total: {
                        type: 'number'
                    },
                    currentPage: {
                        type: 'number'
                    },
                    totalPages: {
                        type: 'number'
                    },
                    data: {
                        type: 'array',
                        items: { $ref: getSchemaPath(model) }
                    }
                }
            }
        })
    );
};