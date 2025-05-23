import { Type } from 'class-transformer';
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
                title: `${model.name.replace('Dto', '')}List`,
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
                        nullable: false,
                        items: { $ref: getSchemaPath(model) }
                    }
                }
            }
        })
    );
};