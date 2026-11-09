export interface CityAlertIncidentInterface {
    id: string;
    source: string;
    category: string;
    type: string;
    title: string;
    description: string;
    lat: number;
    lon: number;
    time: Date;
    severity: string;
    url: string;
    region: string;
    group: string;
}