import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertHistoryPage } from './alert-history.page';

describe('AlertHistoryPage', () => {
  let component: AlertHistoryPage;
  let fixture: ComponentFixture<AlertHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
