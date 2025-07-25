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
                    '&fields=WorkCenterId,WorkCenterName' +
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
