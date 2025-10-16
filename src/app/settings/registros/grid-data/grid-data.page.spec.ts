import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridDataPage } from './grid-data.page';

describe('GridDataPage', () => {
  let component: GridDataPage;
  let fixture: ComponentFixture<GridDataPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GridDataPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
