import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    appController = new AppController();
  });

  it('returns landing metadata from root route', () => {
    const result = appController.getRoot();

    expect(result.ok).toBe(true);
    expect(result.message).toContain('Backend E-Commerce API');
    expect(result.endpoints).toContain('/api/products');
  });

  it('returns health information', () => {
    const result = appController.getHealth();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });
});
