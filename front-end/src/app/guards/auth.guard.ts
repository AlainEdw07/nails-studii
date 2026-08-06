import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, CanMatch, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanLoad, CanMatch {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | Observable<boolean> | Promise<boolean> {
    return this.checkAuthentication(state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[],
  ): boolean | Observable<boolean> | Promise<boolean> {
    const url = `/${segments.map((segment) => segment.path).join('/')}`;
    return this.checkAuthentication(url);
  }

  canMatch(
    route: Route,
    segments: UrlSegment[],
  ): boolean | Observable<boolean> | Promise<boolean> {
    const url = `/${segments.map((segment) => segment.path).join('/')}`;
    return this.checkAuthentication(url);
  }

  private checkAuthentication(redirectUrl: string): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/login'], { queryParams: { returnUrl: redirectUrl } });
    return false;
  }
}
