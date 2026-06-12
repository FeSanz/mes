import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalDetailsPage } from './historical-details.page';

describe('HistoricalDetailsPage', () => {
  let component: HistoricalDetailsPage;
  let fixture: ComponentFixture<HistoricalDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
