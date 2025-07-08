import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionPage } from './production.page';

describe('ProductionPage', () => {
  let component: ProductionPage;
  let fixture: ComponentFixture<ProductionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
