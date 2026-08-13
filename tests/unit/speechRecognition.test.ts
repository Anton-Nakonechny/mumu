import { describe, it, expect, vi, afterEach } from 'vitest';

describe('makeRecognitionService — per-language on-device model selection (FR-007, FR-011, FR-012)', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('T013/en: creates a service referencing the English model URL', async () => {
    const { makeRecognitionService, MODEL_URLS } = await import('../../src/services/speechRecognition');
    const svc = makeRecognitionService('en');
    const modelUrl = MODEL_URLS['en'];
    expect(modelUrl).toContain('vosk-model-small-en-us');
    expect(svc).toBeDefined();
    expect(modelUrl).toMatch(/^\/assets\/models\//); // absolute path per T016/T029
    // The service must not reference another language's model URL
    expect(modelUrl).not.toContain('uk');
    expect(modelUrl).not.toContain('es');
  });

  it('T013/uk: creates a service referencing the Ukrainian model URL', async () => {
    const { makeRecognitionService, MODEL_URLS } = await import('../../src/services/speechRecognition');
    const svc = makeRecognitionService('uk');
    const modelUrl = MODEL_URLS['uk'];
    expect(modelUrl).toContain('vosk-model-small-uk');
    expect(svc).toBeDefined();
    expect(modelUrl).toMatch(/^\/assets\/models\//); // absolute path per T016/T029
    expect(modelUrl).not.toContain('en-us');
    expect(modelUrl).not.toContain('es');
  });

  it('T013/es: creates a service referencing the Spanish model URL', async () => {
    const { makeRecognitionService, MODEL_URLS } = await import('../../src/services/speechRecognition');
    const svc = makeRecognitionService('es');
    const modelUrl = MODEL_URLS['es'];
    expect(modelUrl).toContain('vosk-model-small-es');
    expect(svc).toBeDefined();
    expect(modelUrl).toMatch(/^\/assets\/models\//); // absolute path per T016/T029
    expect(modelUrl).not.toContain('en-us');
    expect(modelUrl).not.toContain('uk');
  });

  it('T014: makeRecognitionService never returns a WebSpeechRecognitionService', async () => {
    const mod = await import('../../src/services/speechRecognition');
    const { makeRecognitionService, OnDeviceRecognitionService } = mod;
    expect(makeRecognitionService('en')).toBeInstanceOf(OnDeviceRecognitionService);
    expect(makeRecognitionService('uk')).toBeInstanceOf(OnDeviceRecognitionService);
    expect(makeRecognitionService('es')).toBeInstanceOf(OnDeviceRecognitionService);
  });
});

describe('OnDeviceRecognitionService — honest degradation (FR-008, FR-012)', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('T015: isAvailable() returns false when model is null (loading/failed)', async () => {
    const { OnDeviceRecognitionService } = await import('../../src/services/speechRecognition');
    const svc = new OnDeviceRecognitionService('/assets/models/vosk-model-small-uk-v3-nano.tar.gz');
    // model starts null — permission not yet requested
    expect(svc.isAvailable()).toBe(false);
  });

  it('T015: requestPermission() returns "unsupported" when model fails to load', async () => {
    vi.doMock('vosk-browser', () => {
      return { createModel: async () => { throw new Error('model load failed'); } };
    });

    // Also mock getUserMedia so permission itself succeeds
    const origGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        ...navigator.mediaDevices,
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [],
        }),
      },
      configurable: true,
    });

    const { OnDeviceRecognitionService } = await import('../../src/services/speechRecognition');
    const svc = new OnDeviceRecognitionService('/assets/models/vosk-model-small-uk-v3-nano.tar.gz');
    const result = await svc.requestPermission();
    expect(result).toBe('unsupported');
    expect(svc.isAvailable()).toBe(false);

    if (origGetUserMedia) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { ...navigator.mediaDevices, getUserMedia: origGetUserMedia },
        configurable: true,
      });
    }
    vi.resetModules();
  });
});
