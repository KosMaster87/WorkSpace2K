/**
 * @fileoverview AuthService Tests
 * @description Prüft HTTP-Aufrufe: login() POST, restoreSession() GET,
 *   korrektes Entpacken des data-Wrappers, request body/headers.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../../store/auth/auth.state';

const mockUser: User = {
  id: 'cuid-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
};

const mockApiResponse: { data: { user: User; token: string } } = {
  data: { user: mockUser, token: 'test-jwt-token' },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login()', () => {
    it('should POST to /api/auth/login', async () => {
      const promise = firstValueFrom(service.login('test@example.com', 'password'));
      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(mockApiResponse);
      await promise;
    });

    it('should send email and password in body', async () => {
      const promise = firstValueFrom(service.login('test@example.com', 'my-password'));
      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'my-password' });
      req.flush(mockApiResponse);
      await promise;
    });

    it('should unwrap data wrapper and return user + token', async () => {
      const promise = firstValueFrom(service.login('test@example.com', 'password'));
      httpMock.expectOne('/api/auth/login').flush(mockApiResponse);

      const result = await promise;
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe('test-jwt-token');
    });
  });

  describe('restoreSession()', () => {
    it('should GET /api/auth/me', async () => {
      const promise = firstValueFrom(service.restoreSession());
      const req = httpMock.expectOne('/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
      await promise;
    });

    it('should unwrap data wrapper and return user + token', async () => {
      const promise = firstValueFrom(service.restoreSession());
      httpMock.expectOne('/api/auth/me').flush(mockApiResponse);

      const result = await promise;
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe('test-jwt-token');
    });
  });
});
