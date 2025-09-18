import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionCampaignPage } from './production-campaign.page';

describe('ProductionCampaignPage', () => {
  let component: ProductionCampaignPage;
  let fixture: ComponentFixture<ProductionCampaignPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductionCampaignPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
