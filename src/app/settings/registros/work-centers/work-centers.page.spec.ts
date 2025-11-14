import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkCentersPage } from './work-centers.page';

describe('WorkCentersPage', () => {
  let component: WorkCentersPage;
  let fixture: ComponentFixture<WorkCentersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkCentersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
