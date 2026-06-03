import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalPage } from './historical.page';

describe('HistoricalPage', () => {
  let component: HistoricalPage;
  let fixture: ComponentFixture<HistoricalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
