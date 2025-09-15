import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CostsPage } from './costs.page';

describe('CostsPage', () => {
  let component: CostsPage;
  let fixture: ComponentFixture<CostsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CostsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
