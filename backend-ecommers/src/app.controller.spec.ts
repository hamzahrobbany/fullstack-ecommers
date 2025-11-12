import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    appController = new AppController();
  });

  it('returns default landing response', () => {
    const result = appController.getHello();

    expect(result).toEqual({
      message: '🚀 Backend E-Commers API is running successfully!',
      docs: '/api/docs',
      version: '1.0.0',
    });
  });

  it('returns health information', () => {
    const result = appController.getHealth();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });
});
