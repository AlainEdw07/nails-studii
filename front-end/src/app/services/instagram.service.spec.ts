import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { InstagramService, InstagramResponse } from './instagram.service';
import { environment } from 'src/environments/environment';

describe('InstagramService (C4: instagram.service)', () => {
  let service: InstagramService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InstagramService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InstagramService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and map Instagram media URLs when token is present', () => {
    environment.instagramAccessToken = 'TEST_TOKEN_123';

    const mockResponse: InstagramResponse = {
      data: [
        { id: '1', media_type: 'IMAGE', media_url: 'http://example.com/img1.jpg' },
        { id: '2', media_type: 'VIDEO', thumbnail_url: 'http://example.com/thumb2.jpg' },
      ],
    };

    service.obtenerFotosFeed(2).subscribe((urls) => {
      expect(urls.length).toBe(2);
      expect(urls).toEqual([
        'http://example.com/img1.jpg',
        'http://example.com/thumb2.jpg',
      ]);
    });

    const req = httpMock.expectOne((r) => r.url === 'https://graph.instagram.com/me/media');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('access_token')).toBe('TEST_TOKEN_123');
    expect(req.request.params.get('limit')).toBe('2');

    req.flush(mockResponse);
  });

  it('should return empty array if token is missing', () => {
    environment.instagramAccessToken = '';

    service.obtenerFotosFeed().subscribe((urls) => {
      expect(urls).toEqual([]);
    });

    httpMock.expectNone('https://graph.instagram.com/me/media');
  });

  it('should handle HTTP error gracefully and return empty array', () => {
    environment.instagramAccessToken = 'TEST_TOKEN_123';

    service.obtenerFotosFeed().subscribe((urls) => {
      expect(urls).toEqual([]);
    });

    const req = httpMock.expectOne((r) => r.url === 'https://graph.instagram.com/me/media');
    req.flush('Error loading Instagram feed', { status: 500, statusText: 'Internal Server Error' });
  });
});
