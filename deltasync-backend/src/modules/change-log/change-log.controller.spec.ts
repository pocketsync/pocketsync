import { Test, TestingModule } from '@nestjs/testing';
import { ChangeLogController } from './change-log.controller';

describe('ChangeLogController', () => {
  let controller: ChangeLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChangeLogController],
    }).compile();

    controller = module.get<ChangeLogController>(ChangeLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
