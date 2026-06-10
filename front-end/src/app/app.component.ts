import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AnimationBuilder, AnimationController } from '@ionic/angular';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  isHome = true;

  constructor(private animationCtrl: AnimationController, private router : Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.isHome = e.urlAfterRedirects === '/home' || e.urlAfterRedirects === '/';
    });
  }

  readonly curtainUpAnimation: AnimationBuilder = (_base, opts) => {
    const enteringEl = opts.enteringEl;
    const leavingEl = opts.leavingEl;

    const entering = this.animationCtrl
      .create()
      .addElement(enteringEl)
      .beforeStyles({
        position: 'absolute',
        inset: '0',
        width: '100%',
        zIndex: '2',
      })
      .fromTo('transform', 'translateY(100%)', 'translateY(0%)')
      .fromTo('opacity', '0.9', '1')

      const animations = [entering];

      if (leavingEl) {
        const leaving = this.animationCtrl
          .create()
          .addElement(leavingEl)
          .beforeStyles({
            position: 'absolute',
            inset: '0',
            width: '100%',
            zIndex: '1'
          })
          .fromTo('transform', 'translateY(0%)', 'translateY(-100%)')
          .fromTo('opacity', '1', '0.8');

          animations.push(leaving);
      }

      return this.animationCtrl
        .create()
        .duration(500)
        .easing('cubic-bezier(0.22, 1, 0.36, 1)')
        .addAnimation(animations)
  }
}
