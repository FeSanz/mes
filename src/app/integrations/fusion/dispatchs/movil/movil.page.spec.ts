import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovilPage } from './movil.page';

describe('MovilPage', () => {
  let component: MovilPage;
  let fixture: ComponentFixture<MovilPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MovilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
