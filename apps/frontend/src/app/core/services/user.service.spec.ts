/**
 * @fileoverview UserService Tests
 * @description Prüft HTTP-Aufrufe: getUsers() GET, createUser() POST,
 *   updateUserRole() PATCH, deleteUser() DELETE.
 *   Prüft korrektes Entpacken des data-Wrappers.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { UserService, CreateUserPayload } from './user.service';
import { User } from '@workspace2k/shared';

const mockUser: User = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'user',
};

const mockAdmin: User = {
  id: 'u2',
  email: 'bob@example.com',
  name: 'Bob',
  role: 'admin',
};

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getUsers ───────────────────────────────────────────────────────────────

  describe('getUsers()', () => {
    it('should GET /api/users', async () => {
      const promise = firstValueFrom(service.getUsers());
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockUser, mockAdmin] });
      await promise;
    });

    it('should unwrap data array', async () => {
      const promise = firstValueFrom(service.getUsers());
      httpMock.expectOne('/api/users').flush({ data: [mockUser, mockAdmin] });
      const result = await promise;
      expect(result).toEqual([mockUser, mockAdmin]);
    });

    it('should return empty array when no users', async () => {
      const promise = firstValueFrom(service.getUsers());
      httpMock.expectOne('/api/users').flush({ data: [] });
      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ── createUser ─────────────────────────────────────────────────────────────

  describe('createUser()', () => {
    const payload: CreateUserPayload = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret',
      role: 'USER',
    };

    it('should POST to /api/users', async () => {
      const promise = firstValueFrom(service.createUser(payload));
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('POST');
      req.flush({ data: mockUser });
      await promise;
    });

    it('should send correct payload', async () => {
      const promise = firstValueFrom(service.createUser(payload));
      const req = httpMock.expectOne('/api/users');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: mockUser });
      await promise;
    });

    it('should unwrap data and return new user', async () => {
      const promise = firstValueFrom(service.createUser(payload));
      httpMock.expectOne('/api/users').flush({ data: mockUser });
      const result = await promise;
      expect(result).toEqual(mockUser);
    });
  });

  // ── updateUserRole ─────────────────────────────────────────────────────────

  describe('updateUserRole()', () => {
    it('should PATCH /api/users/:id/role', async () => {
      const promise = firstValueFrom(service.updateUserRole('u1', 'ADMIN'));
      const req = httpMock.expectOne('/api/users/u1/role');
      expect(req.request.method).toBe('PATCH');
      req.flush({ data: { ...mockUser, role: 'admin' } });
      await promise;
    });

    it('should send role in body', async () => {
      const promise = firstValueFrom(service.updateUserRole('u1', 'ADMIN'));
      const req = httpMock.expectOne('/api/users/u1/role');
      expect(req.request.body).toEqual({ role: 'ADMIN' });
      req.flush({ data: { ...mockUser, role: 'admin' } });
      await promise;
    });

    it('should unwrap data and return updated user', async () => {
      const updated = { ...mockUser, role: 'admin' };
      const promise = firstValueFrom(service.updateUserRole('u1', 'ADMIN'));
      httpMock.expectOne('/api/users/u1/role').flush({ data: updated });
      const result = await promise;
      expect(result).toEqual(updated);
    });
  });

  // ── deleteUser ─────────────────────────────────────────────────────────────

  describe('deleteUser()', () => {
    it('should DELETE /api/users/:id', async () => {
      const promise = firstValueFrom(service.deleteUser('u1'));
      const req = httpMock.expectOne('/api/users/u1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await promise;
    });
  });
});
