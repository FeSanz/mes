import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WcPage } from './wc.page';

describe('WcPage', () => {
  let component: WcPage;
  let fixture: ComponentFixture<WcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
