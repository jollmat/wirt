export interface CommonEventInterface {
    id: unknown;
    lat: number;
    lon: number;
    dist: number;
    title: string;
    description: string;
    type: string;
    category?: string;
    time: Date;
    origin: string;
    originIconId: string;
    link: string;
}