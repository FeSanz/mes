import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpisPage } from './kpis.page';

describe('KpisPage', () => {
  let component: KpisPage;
  let fixture: ComponentFixture<KpisPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KpisPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
