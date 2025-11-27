import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EndpointsService {

  private _params = `limit=500&totalResults=true&onlyData=true&links=canonical`;

  private endPoints: { [key: string]: string } = {
    'organizations': '/inventoryOrganizations?' + this._params +
                      '&fields=OrganizationId,OrganizationCode,OrganizationName,LocationCode,ManagementBusinessUnitId,Status;plantParameters:DefaultWorkMethod' +
                      '&q=ManufacturingPlantFlag=true',

    'auth': '{0}/inventoryOrganizations?limit=1&totalResults=true&onlyData=true&links=canonical' +
             '&fields=OrganizationId',

    'shifts': '/shifts?' + this._params +
                '&fields=ShiftId,Name,StartTime,EndTime,Duration',

    'work_centers': '/workCenters?' + this._params +
                    '&fields=WorkCenterId,WorkCenterCode,WorkCenterName,WorkAreaCode,WorkAreaName' +
                    '&q=OrganizationCode=\'{0}\'',

    'machines': '/productionResources?' + this._params +
                '&fields=ResourceId,ResourceCode,ResourceName,ResourceClassCode' +
                '&finder=findByWorkCenterId;WorkCenterId={0}' +
                '&q=OrganizationCode=\'{1}\' and ResourceType=\'EQUIPMENT\' and Status=\'Active\'',

    'lookups': '/standardLookups?' + this._params +
              '&fields=Meaning,Description;lookupCodes:LookupCode,Meaning' +
              '&q=LookupType=\'{0}\'',

    'items':  '/itemsV2?' + this._params +
              '&fields=ItemId,ItemNumber,ItemDescription,PrimaryUOMValue,LotControlValue' +
              '&q=OrganizationCode=\'{0}\' and ItemStatusValue=\'Active\' and UserItemTypeValue=\'{1}\' and ItemNumber!=\'null\'',

    'items_all': '/itemsV2?' + this._params +
                '&fields=ItemId,ItemNumber,ItemDescription,PrimaryUOMValue,LotControlValue,UserItemTypeValue' +
                '&q=OrganizationCode=\'{0}\' and ItemStatusValue=\'Active\' and ItemNumber!=\'null\'',

    'wo_process': '/processWorkOrders?' + this._params +
                  '&fields=WorkOrderId,WorkOrderNumber,WorkDefinitionId,PrimaryProductId,ItemNumber,Description,PrimaryProductUOMCode,PrimaryProductQuantity,CompletedQuantity,PlannedStartDate,PlannedCompletionDate;ProcessWorkOrderResource:ResourceCode' +
                  '&q=OrganizationCode=\'{0}\' and WorkOrderSystemStatusCode=\'RELEASED\'',

    'wo_discrete': '/workOrders?' + this._params +
                    '&fields=WorkOrderId,WorkOrderNumber,WorkDefinitionId,InventoryItemId,ItemNumber,Description,UOMCode,PlannedStartQuantity,CompletedQuantity,PlannedStartDate,PlannedCompletionDate;WorkOrderResource:ResourceCode' +
                    '&q=OrganizationCode=\'{0}\' and WorkOrderSystemStatusCode=\'RELEASED\'',

    'wo_process_dispatch': '/processWorkOrders?' + this._params +
                          '&fields=WorkOrderId,WorkOrderNumber,WorkDefinitionId,PrimaryProductId,ItemNumber,Description,PrimaryProductQuantity,CompletedQuantity,ScrappedQuantity,RejectedQuantity,PrimaryProductUOMCode,PlannedStartDate,PlannedCompletionDate;' +
                                  'Operation:OperationSequenceNumber,OperationName,ReadyQuantity,CompletedQuantity,ScrappedQuantity,RejectedQuantity,UnitOfMeasure;' +
                                  'ProcessWorkOrderMaterial:OperationSequenceNumber,MaterialSequenceNumber,ItemNumber,ItemDescription,SupplySubinventory,Quantity,IssuedQuantity,UOMCode;' +
                                  'ProcessWorkOrderResource:OperationSequenceNumber,ResourceSequenceNumber,ResourceCode,ResourceName,ResourceType,RequiredUsage,ActualResourceUsage,UOMCode;' +
                                  'ProcessWorkOrderOutput:OperationSequenceNumber,OutputSequenceNumber,ItemNumber,ItemDescription,OutputType,OutputQuantity,CompletedQuantity,UOMCode,PrimaryFlag,ComplSubinventoryCode' +
                          '&q=OrganizationCode=\'{0}\' and WorkOrderNumber=\'{1}\'',

    'wo_discrete_dispatch': '/workOrders?' + this._params +
                          '&fields=WorkOrderId,WorkOrderNumber,WorkDefinitionId,InventoryItemId,ItemNumber,Description,PlannedStartQuantity,CompletedQuantity,ScrappedQuantity,RejectedQuantity,UOMCode,PlannedStartDate,PlannedCompletionDate;' +
                                  'WorkOrderOperation:OperationSequenceNumber,OperationName,ReadyQuantity,CompletedQuantity,ScrappedQuantity,RejectedQuantity,UnitOfMeasure;' +
                                  'WorkOrderMaterial:OperationSequenceNumber,MaterialSequenceNumber,ItemNumber,ItemDescription,SupplySubinventory,Quantity,IssuedQuantity,UOMCode;' +
                                  'WorkOrderResource:OperationSequenceNumber,ResourceSequenceNumber,ResourceCode,ResourceName,ResourceType,RequiredUsage,ActualResourceUsage,UOMCode' +
                          '&q=OrganizationCode=\'{0}\' and WorkOrderNumber=\'{1}\'',

    'wo_process_cost': '/processWorkOrders?' + this._params +
                          '&fields=WorkOrderId,WorkOrderNumber,WorkDefinitionId,PrimaryProductId,ItemNumber,Description,PrimaryProductQuantity,CompletedQuantity,ScrappedQuantity,RejectedQuantity,PrimaryProductUOMCode,PlannedStartDate,PlannedCompletionDate;' +
                                  'Operation:OperationSequenceNumber,OperationName,ReadyQuantity,CompletedQuantity,ScrappedQuantity,RejectedQuantity,UnitOfMeasure;' +
                                  'ProcessWorkOrderMaterial:OperationSequenceNumber,MaterialSequenceNumber,ItemNumber,SupplySubinventory,Quantity,IssuedQuantity,UOMCode;' +
                                  'ProcessWorkOrderResource:OperationSequenceNumber,ResourceSequenceNumber,ResourceCode,ResourceName,ResourceType,RequiredUsage,ActualResourceUsage,UOMCode;' +
                                  'ProcessWorkOrderOutput:OperationSequenceNumber,OutputSequenceNumber,ItemNumber,OutputType,OutputQuantity,CompletedQuantity,UOMCode,PrimaryFlag,ComplSubinventoryCode' +
                          '&q=OrganizationCode=\'{0}\' and WorkOrderSystemStatusCode=\'RELEASED\'',

    'wo_discrete_cost': '/workOrders?' + this._params +
                        '&fields=WorkOrderId,WorkOrderNumber,WorkDefinitionId,InventoryItemId,ItemNumber,Description,PlannedStartQuantity,CompletedQuantity,ScrappedQuantity,RejectedQuantity,UOMCode,PlannedStartDate,PlannedCompletionDate;' +
                                'WorkOrderOperation:OperationSequenceNumber,OperationName,ReadyQuantity,CompletedQuantity,ScrappedQuantity,RejectedQuantity,UnitOfMeasure;' +
                                'WorkOrderMaterial:OperationSequenceNumber,MaterialSequenceNumber,ItemNumber,SupplySubinventory,Quantity,IssuedQuantity,UOMCode;' +
                                'WorkOrderResource:OperationSequenceNumber,ResourceSequenceNumber,ResourceCode,ResourceName,ResourceType,RequiredUsage,ActualResourceUsage,UOMCode' +
                        '&q=OrganizationCode=\'{0}\' and WorkOrderSystemStatusCode=\'RELEASED\'',

    'standard_costs': '/standardCosts?' + this._params +
                      '&fields=ScenarioNumber,CostBookCode,ItemNumber,TotalCost,CurrencyCode,EffectiveStartDate,EffectiveEndDate' +
                      '&q=CostOrgName=\'{0}\' and ({1}) and StatusCode=\'PUBLISHED\' and EffectiveEndDate > \'{2}\'',

    'resource_rates': '/resourceRates?' + this._params +
                      '&fields=ScenarioNumber,CostBookCode,ResourceCode,TotalRate,CurrencyCode,EffectiveStartDate,EffectiveEndDate' +
                      '&q=CostOrgName=\'{0}\' and ({1}) and StatusCode=\'PUBLISHED\' and EffectiveEndDate > \'{2}\'',
  };

  constructor() { }

  Path(key: string, ...args: any[]): string {
    if (!this.endPoints[key]) {
      console.error(`Dirección '${key}' no encontrada`);
      return '';
    }

    return this.FormatString(this.endPoints[key], ...args);
  }

  //Formatear strings con marcadores de posición estilo C#
  private FormatString(pathBase: string, ...args: any[]): string {
    return pathBase.replace(/{(\d+)}/g, (match, index) => {
      return typeof args[index] !== 'undefined' ? String(args[index]) : match;
    });
  }

}
