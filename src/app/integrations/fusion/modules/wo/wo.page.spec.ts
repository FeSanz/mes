import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WoPage } from './wo.page';

describe('WoPage', () => {
  let component: WoPage;
  let fixture: ComponentFixture<WoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
