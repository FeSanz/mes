import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EndpointsService {

  private _urlFusion = `https://${String(localStorage.getItem('server'))}/fscmRestApi/resources/latest`;
  private _params = `limit=500&totalResults=true&onlyData=true&links=canonical`;
  public _urlRender = 'https://iot-services-rd.onrender.com/api';

  private endPoints: { [key: string]: string } = {
    'organizations': '/inventoryOrganizations?' + this._params +
      '&fields=OrganizationId,OrganizationCode,OrganizationName,LocationCode,ManagementBusinessUnitId,Status;plantParameters:DefaultWorkMethod' +
      '&q=ManufacturingPlantFlag=true',

    'auth': '{0}/inventoryOrganizations?limit=1&totalResults=true&onlyData=true&links=canonical' +
      '&fields=OrganizationId',

    'machines': '/machines?' + this._params +
      '&fields=ResourceId,ResourceCode,ResourceName,ResourceClassCode' +
      '&finder=findByWorkCenterId;WorkCenterId={0}' +
      '&q=OrganizationId={1} and ResourceType=\'EQUIPMENT\' and Status=\'Active\'',

    'items': '/itemsV2?' + this._params +
      '&fields=ItemNumber' +
      '&q=OrganizationCode=\'OI_PL1\' and ItemStatusValue=\'Active\' and UserItemTypeValue=\'Finished Good\' and ItemNumber!=\'null\'',
  };

  constructor() { }

  Render(endPoint: string)
  {
    return `${this._urlRender}/${endPoint}` ;
  }

  Path(key: string, ...args: any[]): string {
    if (!this.endPoints[key]) {
      console.error(`Dirección '${key}' no encontrada`);
      return '';
    }

    const pathBase = key != 'auth' ? this._urlFusion + this.endPoints[key] : this.endPoints[key];
    return this.FormatString(pathBase, ...args);
  }

  // Método para formatear strings con marcadores de posición estilo C#
  private FormatString(pathBase: string, ...args: any[]): string {
    return pathBase.replace(/{(\d+)}/g, (match, index) => {
      return typeof args[index] !== 'undefined' ? String(args[index]) : match;
    });
  }

}
