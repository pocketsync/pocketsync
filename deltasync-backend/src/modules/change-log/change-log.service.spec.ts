import { Test, TestingModule } from '@nestjs/testing';
import { ChangeLogService } from './change-log.service';

describe('ChangeLogService', () => {
  let service: ChangeLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChangeLogService],
    }).compile();

    service = module.get<ChangeLogService>(ChangeLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
