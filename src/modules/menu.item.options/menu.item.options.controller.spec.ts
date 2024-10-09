import { Test, TestingModule } from '@nestjs/testing';
import { MenuItemOptionsController } from './menu.item.options.controller';
import { MenuItemOptionsService } from './menu.item.options.service';

describe('MenuItemOptionsController', () => {
  let controller: MenuItemOptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuItemOptionsController],
      providers: [MenuItemOptionsService],
    }).compile();

    controller = module.get<MenuItemOptionsController>(MenuItemOptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
