import { ApiProperty } from "@nestjs/swagger";

export class DefaultSuccessResponse {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;
}
